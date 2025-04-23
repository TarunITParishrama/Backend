const mongoose = require("mongoose");

const DetailedReportSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    campus: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    stream: {
      type: String,
      required: true,
      enum: ["LongTerm", "PUC"]
    },
    testName: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    subjects: [
      {
        subjectName: {
          type: String,
          required: true
        },
        totalQuestionsAttempted: {
          type: Number,
          required: true
        },
        totalQuestionsUnattempted: {
          type: Number,
          required: true
        },
        correctAnswers: {
          type: Number,
          required: true
        },
        wrongAnswers: {
          type: Number,
          required: true
        },
        totalMarks: {
          type: Number,
          required: true
        }
      }
    ],
    overallTotalMarks: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    percentile: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
DetailedReportSchema.index({ regNumber: 1, testName: 1 });
DetailedReportSchema.index({ testName: 1, date: 1 });
DetailedReportSchema.index({ stream: 1, testName: 1 });
DetailedReportSchema.index({ regNumber: 1, stream: 1 });

module.exports = mongoose.model("DetailedReport", DetailedReportSchema);