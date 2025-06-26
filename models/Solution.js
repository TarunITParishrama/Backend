const mongoose = require("mongoose");

const SolutionSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

SolutionSchema.index({ testName: 1 });
SolutionSchema.index({ date: 1, stream: 1 });
SolutionSchema.index({ stream: 1 });
SolutionSchema.index({ testName: 1, date: 1, stream: 1 });

module.exports = mongoose.model("Solution", SolutionSchema);
