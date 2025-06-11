const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }, 
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true }, 
  subtopic: { type: mongoose.Schema.Types.ObjectId, ref: "Subtopic", required: true }, 

  questionText: { type: String, required: true },
  questionImage: { type: String },

  questionType: {
    type: String,
    required: true,
    enum: ["MCQ", "Fill in the Blanks"]
  },
  options: [
    {
      text: { type: [String], required: true },
      image: { type: String }
    }
  ],

  solution: { type: String, required: true },
  solutionImage: { type: String }
});

module.exports = mongoose.model("Question", questionSchema);
