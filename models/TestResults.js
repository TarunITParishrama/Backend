const mongoose = require("mongoose");

const subjectResultSchema = new mongoose.Schema(
  {
    scored: Number,
    marks: Number,
  },
  { _id: false }
);

const testResultsSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, index: true },
  testName: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  stream: { type: String, required: true },
  patternId: { type: mongoose.Schema.Types.ObjectId, ref: "Pattern" },
  subjects: { type: Map, of: subjectResultSchema },
  totalMarks: { type: Number, required: true },
  percentile: { type: Number, required: true },
  percentage: { type: Number, required: true },
  rank: { type: Number, required: true },
  isPresent: { type: Boolean, default: true }, // New field
  createdAt: { type: Date, default: Date.now },
});

// Compound indexes for common query patterns
testResultsSchema.index({ regNumber: 1, testName: 1 });
testResultsSchema.index({ testName: 1, date: 1 });
testResultsSchema.index({ regNumber: 1, date: 1 });
testResultsSchema.index({ regNumber: 1, isPresent: 1 });

module.exports = mongoose.model("TestResults", testResultsSchema);
