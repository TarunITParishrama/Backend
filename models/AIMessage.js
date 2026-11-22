const mongoose = require("mongoose");

const AIMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    role: {
      type: String,
      enum: ["parent", "assistant"],
      required: true,
    },

    // Message content.
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    // Normal text message or the initial greeting.
    messageType: {
      type: String,
      enum: ["text", "greeting"],
      default: "text",
    },

    // Sequential ordering within the conversation.
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },

    // Unique ID supplied by the mobile app.
    // Used to prevent duplicate parent messages.
    clientMessageId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined,
    },

    // Links an AI response to the parent message it answers.
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIMessage",
      default: null,
    },

    // Tracks the AI generation lifecycle.
    generationStatus: {
      type: String,
      enum: ["not_applicable", "pending", "processing", "completed", "failed"],
      default: "not_applicable",
    },

    // Used to prevent simultaneous generation for the same message.
    processingToken: {
      type: String,
      default: null,
      select: false,
    },

    processingAt: {
      type: Date,
      default: null,
      select: false,
    },

    // Internal error classification.
    // Never store API keys or sensitive error details here.
    errorCode: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "ai_messages",
  },
);

AIMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Retrieve messages in their exact conversation order.
AIMessageSchema.index({ conversationId: 1, sequence: 1 }, { unique: true });

// Retrieve the latest messages efficiently.
AIMessageSchema.index({
  conversationId: 1,
  createdAt: -1,
});

// Prevent duplicate submissions from the mobile app.
// Only messages containing a clientMessageId participate.
AIMessageSchema.index(
  {
    conversationId: 1,
    clientMessageId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      clientMessageId: { $type: "string" },
    },
  },
);

// Only one initial greeting is allowed per conversation.
AIMessageSchema.index(
  {
    conversationId: 1,
    messageType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      messageType: "greeting",
    },
  },
);

// Prevent multiple AI responses for the same parent message.
AIMessageSchema.index(
  {
    replyToMessageId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      replyToMessageId: { $type: "objectId" },
    },
  },
);

const AIMessage = mongoose.model("AIMessage", AIMessageSchema);

module.exports = AIMessage;
