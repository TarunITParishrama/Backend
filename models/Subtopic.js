const mongoose = require("mongoose");

const subtopicSchema = new mongoose.Schema({
  subtopicName: { type: String, required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true,
  },
});

module.exports = mongoose.model("Subtopic", subtopicSchema);
