const mongoose = require("mongoose");

const ParentAppReview = require("../models/ParentAppReview");
const Student = require("../models/Students");

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_REVIEW_LENGTH = 1000;

// Resolve the student from the authenticated parent token.
const getAuthenticatedStudent = async (req) => {
  const studentId = req.parent?.id;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return null;
  }

  return Student.findById(studentId).select("studentName regNumber");
};

// Find or create the student's review-cycle record.
const getOrCreateReview = async (student) => {
  let review = await ParentAppReview.findOne({
    studentId: student._id,
  });

  if (review) {
    return review;
  }

  const firstUsedAt = new Date();

  try {
    review = await ParentAppReview.create({
      studentId: student._id,
      regNumber: student.regNumber,
      firstUsedAt,
      nextPromptAt: new Date(firstUsedAt.getTime() + FIVE_DAYS_MS),
    });

    return review;
  } catch (error) {
    // Handle simultaneous first-time requests.
    if (error.code === 11000) {
      return ParentAppReview.findOne({
        studentId: student._id,
      });
    }

    throw error;
  }
};

// GET REVIEW STATUS
exports.getStatus = async (req, res) => {
  try {
    const student = await getAuthenticatedStudent(req);

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student account not found",
      });
    }

    const review = await getOrCreateReview(student);

    if (!review) {
      return res.status(500).json({
        status: "error",
        message: "Unable to initialize review status",
      });
    }

    if (review.status === "submitted") {
      return res.status(200).json({
        status: "success",
        data: {
          shouldShow: false,
          submitted: true,
        },
      });
    }

    // Support records created before nextPromptAt was initialized.
    let nextPromptAt = review.nextPromptAt;

    if (!nextPromptAt) {
      nextPromptAt = new Date(review.firstUsedAt.getTime() + FIVE_DAYS_MS);

      review.nextPromptAt = nextPromptAt;
      await review.save();
    }

    const shouldShow = new Date() >= nextPromptAt;

    return res.status(200).json({
      status: "success",
      data: {
        shouldShow,
        submitted: false,
        firstUsedAt: review.firstUsedAt,
        nextPromptAt: review.nextPromptAt,
        lastPromptAt: review.lastPromptAt,
      },
    });
  } catch (error) {
    console.error("[Parent App Review] Status error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to check review status",
    });
  }
};

// DISMISS REVIEW PROMPT
exports.dismiss = async (req, res) => {
  try {
    const student = await getAuthenticatedStudent(req);

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student account not found",
      });
    }

    const review = await getOrCreateReview(student);

    if (!review) {
      return res.status(500).json({
        status: "error",
        message: "Unable to initialize review status",
      });
    }

    if (review.status === "submitted") {
      return res.status(200).json({
        status: "success",
        message: "Review already submitted",
      });
    }

    const now = new Date();

    // A future date means this prompt has already been dismissed.
    // Do not keep extending the date on repeated requests.
    if (review.nextPromptAt && review.nextPromptAt > now) {
      return res.status(200).json({
        status: "success",
        message: "Review prompt already postponed",
        data: {
          nextPromptAt: review.nextPromptAt,
        },
      });
    }

    review.lastPromptAt = now;
    review.nextPromptAt = new Date(now.getTime() + FIVE_DAYS_MS);

    await review.save();

    return res.status(200).json({
      status: "success",
      message: "Review prompt postponed",
      data: {
        nextPromptAt: review.nextPromptAt,
      },
    });
  } catch (error) {
    console.error("[Parent App Review] Dismiss error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to postpone review prompt",
    });
  }
};

// SUBMIT REVIEW
exports.submit = async (req, res) => {
  try {
    const student = await getAuthenticatedStudent(req);

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student account not found",
      });
    }

    const { rating, review: reviewText = "" } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a rating between 1 and 5",
      });
    }

    if (typeof reviewText !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Review must be a valid string",
      });
    }

    if (reviewText.trim().length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({
        status: "error",
        message: `Review cannot exceed ${MAX_REVIEW_LENGTH} characters`,
      });
    }

    const review = await getOrCreateReview(student);

    if (!review) {
      return res.status(500).json({
        status: "error",
        message: "Unable to initialize review status",
      });
    }

    if (review.status === "submitted") {
      return res.status(409).json({
        status: "error",
        message: "You have already submitted your review",
      });
    }

    review.rating = rating;
    review.review = reviewText.trim();
    review.submittedAt = new Date();
    review.status = "submitted";

    await review.save();

    return res.status(200).json({
      status: "success",
      message: "Thank you for sharing your feedback!",
      data: {
        rating: review.rating,
        submittedAt: review.submittedAt,
      },
    });
  } catch (error) {
    console.error("[Parent App Review] Submit error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to submit your review",
    });
  }
};
