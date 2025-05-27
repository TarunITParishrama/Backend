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
      enum: ["LongTerm", "PUC"],
      index: true
    },
    testName: {
      type: String,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    subjects: [
      {
        subjectName: {
          type: String,
          required: true
        },
        scored: {
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
    fullMarks: {
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
    },
    rank: {
      type: Number,
      required: true
    },
    isPresent: {
      type: Boolean,
      required: true,
      default: true
    },
    remarks: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

DetailedReportSchema.index({ regNumber: 1, stream: 1 });
DetailedReportSchema.index({ testName: 1, stream: 1 });
DetailedReportSchema.index({ regNumber: 1, testName: 1, stream: 1 });
DetailedReportSchema.index({ date: 1, stream: 1 });

// Pre-save hook to set remarks based on percentile
DetailedReportSchema.pre('save', function(next) {
  if (this.percentile < 50) {
    this.remarks = "Needs foundational revision";
  } else if (this.percentile >= 50 && this.percentile < 75) {
    this.remarks = "May secure BDS / AYUSH / Pvt Mgmt seat";
  } else if (this.percentile >= 75 && this.percentile < 90) {
    this.remarks = "Pvt MBBS / Reserved Govt possibility";
  } else {
    this.remarks = "High performance zone - Strong Govt MBBS chance";
  }
  next();
});

module.exports = mongoose.model("DetailedReport", DetailedReportSchema);