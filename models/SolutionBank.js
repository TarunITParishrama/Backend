const mongoose = require("mongoose");

const SolutionBankSchema = new mongoose.Schema({
  solutionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Solution",
    required: true,
  },
  date: { type: Date, required: true },
  questionNumber: { type: Number, required: true },
  questionText: {
    type: String,
    maxlength: 1000,
    default: "",
    trim: true,
  },
  questionImages: [{
    type: String
  }],
  correctOptions: { type: [String] },
  correctSolution: { type: String, required: false },
  isGrace: { type: Boolean, default: false },
});

module.exports = mongoose.model("SolutionBank", SolutionBankSchema);
