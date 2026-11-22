const express = require("express");
const router = express.Router();

const { authenticateParent } = require("../middleware/auth.middleware");

const {
  openConversation,
  getConversationHistory,
  chatWithStudentAI,
  retryAIMessage,
} = require("../controllers/aiChat.controller");

// Open or create the authenticated student's conversation.
router.post("/api/ai/conversation/open", authenticateParent, openConversation);

// Retrieve saved conversation messages.
router.get(
  "/api/ai/conversation/messages",
  authenticateParent,
  getConversationHistory,
);

// Send a parent message to the AI companion.
router.post("/api/ai/chat", authenticateParent, chatWithStudentAI);

// Retry a failed AI response.
router.post(
  "/api/ai/chat/:messageId/retry",
  authenticateParent,
  retryAIMessage,
);

module.exports = router;
