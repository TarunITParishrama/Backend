const mongoose = require("mongoose");

const AIConversationSchema = new mongoose.Schema(
  {

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Sequence counter used to maintain message ordering.
    nextSequence: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Language used when the initial greeting is created.
    greetingLanguage: {
      type: String,
      enum: ["en", "kn", "kn-en"],
      default: "en",
    },

    // Last activity in this conversation.
    lastMessageAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "ai_conversations",
  },
);

// One persistent conversation per student.
AIConversationSchema.index({ studentId: 1 }, { unique: true });

// Useful when retrieving active conversations.
AIConversationSchema.index({
  status: 1,
  lastMessageAt: -1,
});

const AIConversation = mongoose.model("AIConversation", AIConversationSchema);

module.exports = AIConversation;
