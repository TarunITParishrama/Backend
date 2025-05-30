const mongoose = require("mongoose");

const feedbackFormSchema = new mongoose.Schema(
  {
    questions: [
      {
        questionNumber: {
          type: String,
          required: true,
          match: [/^Q\d+$/, "Question number must be in format Q1, Q2, etc."]
        },
        questionStatement: {
          type: String,
          required: true,
          maxlength: 500
        }
      }
    ],
    options: {
      type: Map,
      of: String,
      default: {
        A: "Excellent",
        B: "Good",
        C: "Average",
        D: "Poor"
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FeedbackForm", feedbackFormSchema);