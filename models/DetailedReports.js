const mongoose = require("mongoose");
const { getPerformanceLevel } = require("../utils/performance.util");
const { getRemarks } = require("../utils/remarks.util");

const DetailedReportSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    campus: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    stream: {
      type: String,
      required: true,
      enum: ["LongTerm", "PUC"],
      index: true,
    },
    testName: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    subjects: [
      {
        subjectName: {
          type: String,
          required: true,
        },
        scored: {
          type: Number,
          required: true,
        },
        totalMarks: {
          type: Number,
          required: true,
        },
      },
    ],
    overallTotalMarks: {
      type: Number,
      required: true,
    },
    fullMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    percentile: {
      type: Number,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    isPresent: {
      type: Boolean,
      required: true,
      default: true,
    },
    remarks: {
      type: String,
      required: true,
    },
    performanceStatus: {
      type: String,
      enum: [
        "Outstanding",
        "Excellent",
        "Very Good",
        "Good",
        "Average",
        "Needs Improvement",
      ],
      default: null,
    },
    performanceScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true },
);

DetailedReportSchema.index({ regNumber: 1, stream: 1 });
DetailedReportSchema.index({ testName: 1, stream: 1 });
DetailedReportSchema.index({ regNumber: 1, testName: 1, stream: 1 });
DetailedReportSchema.index({ date: 1, stream: 1 });

DetailedReportSchema.pre("save", function (next) {
  //for remarks based on percentile
  this.remarks = getRemarks(this.percentile);

  //for performance status and score based on percentage
  const performance = getPerformanceLevel(this.percentage);

  this.performanceStatus = performance.performanceStatus;
  this.performanceScore = performance.performanceScore;

  next();
});

module.exports = mongoose.model("DetailedReport", DetailedReportSchema);
