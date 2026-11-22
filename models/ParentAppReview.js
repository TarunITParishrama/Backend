const mongoose = require("mongoose");

const ParentAppReviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      required: true,
      unique: true,
    },

    regNumber: {
      type: String,
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    review: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    firstUsedAt: {
      type: Date,
      default: Date.now,
    },

    lastPromptAt: {
      type: Date,
      default: null,
    },

    nextPromptAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "submitted"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ParentAppReview", ParentAppReviewSchema);
