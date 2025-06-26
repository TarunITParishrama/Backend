const mongoose = require("mongoose");

const subjectResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  marks: { type: Number, required: true },
});

const studentResultSchema = new mongoose.Schema({
  regNumber: { type: String, required: true },
  subjectMarks: [subjectResultSchema],
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
});

const subjectDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true, max: 50 },
});

const theoryTestSchema = new mongoose.Schema(
  {
    stream: {
      type: String,
      required: true,
      enum: ["PUC", "LongTerm"],
    },
    questionType: {
      type: String,
      required: true,
      default: "Theory",
      enum: ["Theory"],
    },
    testName: { type: String, required: true },
    date: { type: Date, required: true },
    subjectDetails: [subjectDetailSchema],
    studentResults: [studentResultSchema],
  },
  { timestamps: true }
);

// Compound indexes for faster queries
theoryTestSchema.index({ stream: 1, testName: 1 });
theoryTestSchema.index({ "studentResults.regNumber": 1 });

module.exports = mongoose.model("TheoryTest", theoryTestSchema);
