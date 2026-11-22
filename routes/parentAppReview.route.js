const express = require("express");
const router = express.Router();

const { authenticateParent } = require("../middleware/auth.middleware");

const {
  getStatus,
  dismiss,
  submit,
} = require("../controllers/parentAppReview.controller");

// Check whether the parent should receive a rating prompt.
router.get("/api/parent-app-review/status", authenticateParent, getStatus);

// Dismiss the rating prompt for another five days.
router.post("/api/parent-app-review/dismiss", authenticateParent, dismiss);

// Submit the parent's rating and optional review.
router.post("/api/parent-app-review/submit", authenticateParent, submit);

module.exports = router;
