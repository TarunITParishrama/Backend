const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    feedbackForm:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedbackForm",
      required: true
    },
    date: {
      type: Date,
      required: true,
      unique: true
    },
    questions: [
      {
        questionNumber: {
          type: String,
          required: true
        },
        questionStatement: {
          type: String,
          required: true
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
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);