const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  chapterName: {
    type: String,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
});

module.exports = mongoose.model("Chapter", chapterSchema);
