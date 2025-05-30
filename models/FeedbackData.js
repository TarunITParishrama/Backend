const mongoose = require("mongoose");

const feedbackDataSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    questions: [
      {
        questionNumber: {
          type: String,
          required: true
        },
        option: {
          type: String,
          required: true,
          enum: ["A", "B", "C", "D"]
        }
      }
    ],
    optionACount: {
      type: Number,
      default: 0
    },
    optionBCount: {
      type: Number,
      default: 0
    },
    optionCCount: {
      type: Number,
      default: 0
    },
    optionDCount: {
      type: Number,
      default: 0
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true
    },
    campusName: {
      type: String,
      required: true
    },
    campusCount: {
      type: Number,
      required: true
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

// Add compound index for date and campus
feedbackDataSchema.index({ date: 1, campus: 1 }, { unique: true });

module.exports = mongoose.model("FeedbackData", feedbackDataSchema);