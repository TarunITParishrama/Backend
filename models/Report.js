const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    stream: {
      type: String,
      enum: ["LongTerm", "PUC"],
      required: true,
    },
    questionType: {
      type: String,
      enum: ["MCQ", "Theory"],
      required: true,
    },
    testName: {
      type: String,
      required: true,
    },
    marksType: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ testName: 1 });
ReportSchema.index({ date: 1, stream: 1 });
ReportSchema.index({ stream: 1 });
ReportSchema.index({ testName: 1, date: 1, stream: 1 });
ReportSchema.index({ stream: 1, date: -1 });
ReportSchema.index({ date: -1 });

module.exports = mongoose.model("Report", ReportSchema);
