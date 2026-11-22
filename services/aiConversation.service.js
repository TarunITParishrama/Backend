const crypto = require("crypto");

const AIConversation = require("../models/AIConversation");
const AIMessage = require("../models/AIMessage");

const DEFAULT_HISTORY_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LIMIT = 50;
const PROCESSING_LOCK_TIMEOUT = 2 * 60 * 1000;

// Every individual message expires 24 hours after its own creation.
const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

const INITIAL_GREETINGS = {
  en: "Hi Amma/Appa! 😊 How can I help you today?",

  kn: "ನಮಸ್ಕಾರ ಅಮ್ಮ/ಅಪ್ಪ! 😊 ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",

  "kn-en": "Hi Amma/Appa! 😊 ಹೇಗಿದ್ದೀರಾ? How can I help you today?",
};

// --------------------------------------------------
// MESSAGE EXPIRY HELPERS
// --------------------------------------------------

function getMessageTimestamps() {
  const createdAt = new Date();

  return {
    createdAt,
    expiresAt: new Date(createdAt.getTime() + MESSAGE_TTL_MS),
  };
}

function isMessageActive(message) {
  return Boolean(
    message?.expiresAt && new Date(message.expiresAt).getTime() > Date.now(),
  );
}

function getActiveMessageQuery() {
  return {
    expiresAt: { $gt: new Date() },
  };
}

// --------------------------------------------------
// LANGUAGE CONFIGURATION
// --------------------------------------------------

function normalizeLanguage(language) {
  const supportedLanguages = ["en", "kn", "kn-en"];

  return supportedLanguages.includes(language) ? language : "en";
}

// --------------------------------------------------
// CONVERSATION CREATION
// --------------------------------------------------

async function getOrCreateConversation(studentId, language = "en") {
  const normalizedLanguage = normalizeLanguage(language);

  const conversation = await AIConversation.findOneAndUpdate(
    { studentId },
    {
      $setOnInsert: {
        studentId,
        greetingLanguage: normalizedLanguage,
        nextSequence: 0,
        status: "active",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return conversation;
}

// --------------------------------------------------
// SEQUENCE GENERATION
// --------------------------------------------------

async function allocateSequence(conversationId) {
  const conversation = await AIConversation.findOneAndUpdate(
    { _id: conversationId },
    {
      $inc: {
        nextSequence: 1,
      },
    },
    {
      new: true,
      projection: {
        nextSequence: 1,
      },
    },
  );

  if (!conversation) {
    throw new Error("Conversation not found while allocating sequence");
  }

  return conversation.nextSequence;
}

// --------------------------------------------------
// INITIAL GREETING
// --------------------------------------------------

async function ensureInitialGreeting(conversation, language = "en") {
  const existingGreeting = await AIMessage.findOne({
    conversationId: conversation._id,
    messageType: "greeting",
  }).lean();

  if (existingGreeting) {
    // Never return an expired greeting.
    // The unique greeting index remains in place until MongoDB
    // physically removes the expired document.
    if (isMessageActive(existingGreeting)) {
      return existingGreeting;
    }

    return null;
  }

  const normalizedLanguage = normalizeLanguage(
    conversation.greetingLanguage || language,
  );

  // Preserve the language selected when the conversation is opened.
  await AIConversation.updateOne(
    {
      _id: conversation._id,
      nextSequence: 0,
    },
    {
      $set: {
        greetingLanguage: normalizedLanguage,
      },
    },
  );

  const sequence = await allocateSequence(conversation._id);
  const timestamps = getMessageTimestamps();

  const greeting = {
    conversationId: conversation._id,
    studentId: conversation.studentId,
    role: "assistant",
    content: INITIAL_GREETINGS[normalizedLanguage],
    messageType: "greeting",
    sequence,
    generationStatus: "completed",
    ...timestamps,
  };

  try {
    const createdGreeting = await AIMessage.create(greeting);

    await AIConversation.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageAt: createdGreeting.createdAt,
        },
      },
    );

    return createdGreeting;
  } catch (error) {
    // Another request may have created the greeting simultaneously.
    if (error.code === 11000) {
      const existing = await AIMessage.findOne({
        conversationId: conversation._id,
        messageType: "greeting",
      }).lean();

      if (existing && isMessageActive(existing)) {
        return existing;
      }

      return null;
    }

    throw error;
  }
}

// --------------------------------------------------
// PARENT MESSAGE CREATION
// --------------------------------------------------

async function createOrGetParentMessage({
  conversationId,
  studentId,
  content,
  clientMessageId,
}) {
  const normalizedClientMessageId =
    typeof clientMessageId === "string" && clientMessageId.trim()
      ? clientMessageId.trim()
      : crypto.randomUUID();

  // Idempotency check: return an existing message instead of
  // creating another one for the same client submission.
  const existingMessage = await AIMessage.findOne({
    conversationId,
    role: "parent",
    clientMessageId: normalizedClientMessageId,
  });

  if (existingMessage) {
    return {
      message: existingMessage,
      isNew: false,
    };
  }

  const sequence = await allocateSequence(conversationId);
  const timestamps = getMessageTimestamps();

  try {
    const message = await AIMessage.create({
      conversationId,
      studentId,
      role: "parent",
      content: content.trim(),
      messageType: "text",
      sequence,
      clientMessageId: normalizedClientMessageId,
      generationStatus: "pending",
      ...timestamps,
    });

    await AIConversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessageAt: message.createdAt,
        },
      },
    );

    return {
      message,
      isNew: true,
    };
  } catch (error) {
    // Handles simultaneous duplicate submissions.
    if (error.code === 11000) {
      const existing = await AIMessage.findOne({
        conversationId,
        role: "parent",
        clientMessageId: normalizedClientMessageId,
      });

      if (existing) {
        return {
          message: existing,
          isNew: false,
        };
      }
    }

    throw error;
  }
}

// --------------------------------------------------
// GENERATION LOCK
// --------------------------------------------------

async function claimMessageForGeneration(messageId) {
  const processingToken = crypto.randomUUID();

  const staleProcessingTime = new Date(Date.now() - PROCESSING_LOCK_TIMEOUT);

  const claimedMessage = await AIMessage.findOneAndUpdate(
    {
      _id: messageId,
      role: "parent",
      ...getActiveMessageQuery(),
      $or: [
        { generationStatus: "pending" },
        { generationStatus: "failed" },
        {
          generationStatus: "processing",
          processingAt: { $lt: staleProcessingTime },
        },
        {
          generationStatus: "processing",
          processingAt: null,
        },
      ],
    },
    {
      $set: {
        generationStatus: "processing",
        processingToken,
        processingAt: new Date(),
        errorCode: null,
      },
    },
    {
      new: true,
    },
  );

  if (claimedMessage) {
    return {
      status: "claimed",
      message: claimedMessage,
      processingToken,
    };
  }

  // Check whether the message exists and is still active.
  const existingMessage = await AIMessage.findById(messageId);

  if (!existingMessage) {
    return {
      status: "not_found",
    };
  }

  if (!isMessageActive(existingMessage)) {
    return {
      status: "expired",
      message: existingMessage,
    };
  }

  const existingReply = await getAssistantReply(existingMessage._id);

  if (existingReply) {
    return {
      status: "completed",
      message: existingMessage,
      assistantMessage: existingReply,
    };
  }

  if (existingMessage.generationStatus === "processing") {
    return {
      status: "processing",
      message: existingMessage,
    };
  }

  if (existingMessage.generationStatus === "completed") {
    return {
      status: "completed",
      message: existingMessage,
      assistantMessage: null,
    };
  }

  return {
    status: "unavailable",
    message: existingMessage,
  };
}

// --------------------------------------------------
// ASSISTANT RESPONSE RETRIEVAL
// --------------------------------------------------

async function getAssistantReply(parentMessageId) {
  return AIMessage.findOne({
    replyToMessageId: parentMessageId,
    role: "assistant",
    ...getActiveMessageQuery(),
  });
}

// --------------------------------------------------
// SAVE SUCCESSFUL AI RESPONSE
// --------------------------------------------------

async function saveAssistantResponse({
  parentMessage,
  content,
  processingToken,
}) {
  // Check first in case an earlier attempt saved the response
  // but failed before updating the parent message.
  const existingReply = await getAssistantReply(parentMessage._id);

  if (existingReply) {
    await AIMessage.updateOne(
      {
        _id: parentMessage._id,
        generationStatus: { $ne: "completed" },
        ...getActiveMessageQuery(),
      },
      {
        $set: {
          generationStatus: "completed",
          processingToken: null,
          processingAt: null,
          errorCode: null,
        },
      },
    );

    return existingReply;
  }

  // Verify that this request still owns the generation lock
  // and that the parent message has not expired.
  const currentParent = await AIMessage.findOne({
    _id: parentMessage._id,
    generationStatus: "processing",
    processingToken,
    ...getActiveMessageQuery(),
  });

  if (!currentParent) {
    throw new Error(
      "Message generation lock is no longer valid or the message has expired",
    );
  }

  const sequence = await allocateSequence(parentMessage.conversationId);
  const timestamps = getMessageTimestamps();

  let assistantMessage;

  try {
    assistantMessage = await AIMessage.create({
      conversationId: parentMessage.conversationId,
      studentId: parentMessage.studentId,
      role: "assistant",
      content: content.trim(),
      messageType: "text",
      sequence,
      replyToMessageId: parentMessage._id,
      generationStatus: "completed",
      ...timestamps,
    });
  } catch (error) {
    // If another request saved the response first, retrieve it.
    if (error.code === 11000) {
      assistantMessage = await getAssistantReply(parentMessage._id);

      if (!assistantMessage) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Mark the parent message completed only after the AI response
  // has been successfully stored.
  await AIMessage.updateOne(
    {
      _id: parentMessage._id,
      processingToken,
      ...getActiveMessageQuery(),
    },
    {
      $set: {
        generationStatus: "completed",
        processingToken: null,
        processingAt: null,
        errorCode: null,
      },
    },
  );

  await AIConversation.updateOne(
    { _id: parentMessage.conversationId },
    {
      $set: {
        lastMessageAt: assistantMessage.createdAt,
      },
    },
  );

  return assistantMessage;
}

// --------------------------------------------------
// FAILED GENERATION
// --------------------------------------------------

async function markMessageGenerationFailed(
  messageId,
  processingToken,
  errorCode = "AI_GENERATION_FAILED",
) {
  return AIMessage.findOneAndUpdate(
    {
      _id: messageId,
      generationStatus: "processing",
      processingToken,
      ...getActiveMessageQuery(),
    },
    {
      $set: {
        generationStatus: "failed",
        processingToken: null,
        processingAt: null,
        errorCode,
      },
    },
    {
      new: true,
    },
  );
}

// --------------------------------------------------
// RECENT CONVERSATION HISTORY
// --------------------------------------------------

async function getRecentConversationHistory(
  conversationId,
  excludeMessageId = null,
  limit = DEFAULT_HISTORY_LIMIT,
) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_HISTORY_LIMIT, 1),
    DEFAULT_HISTORY_LIMIT,
  );

  const query = {
    conversationId,
    ...getActiveMessageQuery(),
  };

  if (excludeMessageId) {
    query._id = { $ne: excludeMessageId };
  }

  const messages = await AIMessage.find(query)
    .sort({ sequence: -1 })
    .limit(safeLimit)
    .select("role content messageType sequence createdAt expiresAt")
    .lean();

  // Gemini receives messages in chronological order.
  return messages.reverse();
}

// --------------------------------------------------
// CONVERSATION MESSAGE HISTORY
// --------------------------------------------------

async function getConversationMessages(
  conversationId,
  studentId,
  options = {},
) {
  const requestedLimit = Number(options.limit) || DEFAULT_MESSAGE_LIMIT;

  const limit = Math.min(Math.max(requestedLimit, 1), MAX_MESSAGE_LIMIT);

  const query = {
    conversationId,
    studentId,
    ...getActiveMessageQuery(),
  };

  if (options.beforeSequence !== undefined) {
    const beforeSequence = Number(options.beforeSequence);

    if (Number.isInteger(beforeSequence) && beforeSequence > 0) {
      query.sequence = { $lt: beforeSequence };
    }
  }

  const messages = await AIMessage.find(query)
    .sort({ sequence: -1 })
    .limit(limit)
    .select(
      "_id role content messageType sequence generationStatus replyToMessageId createdAt expiresAt",
    )
    .lean();

  return messages.reverse();
}

// --------------------------------------------------
// CONVERSATION OWNERSHIP
// --------------------------------------------------

async function getStudentConversation(studentId) {
  return AIConversation.findOne({
    studentId,
    status: "active",
  });
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  getOrCreateConversation,
  ensureInitialGreeting,
  createOrGetParentMessage,
  claimMessageForGeneration,
  getAssistantReply,
  saveAssistantResponse,
  markMessageGenerationFailed,
  getRecentConversationHistory,
  getConversationMessages,
  getStudentConversation,
};
