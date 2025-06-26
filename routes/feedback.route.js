const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const authMiddleware = require("../middleware/auth.middleware");

// FeedbackForm routes
router.post(
  "/api/createfeedbackform",
  authMiddleware.protect,
  feedbackController.createFeedbackForm
);
router.get("/api/getfeedbackforms", feedbackController.getFeedbackForms);
router.put(
  "/api/updatefeedbackform/:id",
  feedbackController.updateFeedbackForm
);
router.delete(
  "/api/deletefeedbackform/:id",
  feedbackController.deleteFeedbackForm
);

// Feedback routes
router.post("/api/createfeedback", feedbackController.createFeedback);
router.get("/api/getfeedbacks", feedbackController.getFeedbacks);
router.delete("/api/deletefeedback/:id", feedbackController.deleteFeedback);

// FeedbackData routes
router.post("/api/createfeedbackdata", feedbackController.createFeedbackData);
router.post(
  "/api/bulkcreatefeedbackdata",
  feedbackController.bulkCreateFeedbackData
);
router.get(
  "/api/getfeedbackdata",
  authMiddleware.protect,
  feedbackController.getFeedbackData
);
router.get(
  "/api/getfeedbackdata/dates",
  authMiddleware.protect,
  feedbackController.getAvailableFeedbackDates
);

router.put(
  "/api/updatefeedbackdata/:id",
  feedbackController.updateFeedbackData
);
router.delete(
  "/api/deletefeedbackdata/:id",
  feedbackController.deleteFeedbackData
);

module.exports = router;
