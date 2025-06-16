const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  option: { 
    type: String, 
    required: true, 
    enum: ["A", "B", "C", "D"] 
  }
});

const questionSchema = new mongoose.Schema({
  questionNumber: { 
    type: String, 
    required: true 
  },
  responses: [responseSchema],
  countA: { 
    type: Number, 
    default: 0 
  },
  countB: { 
    type: Number, 
    default: 0 
  },
  countC: { 
    type: Number, 
    default: 0 
  },
  countD: { 
    type: Number, 
    default: 0 
  },
  noResponse: { 
    type: Number, 
    default: 0 
  }
});

const feedbackDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  date: { 
    type: Date, 
    required: true 
  },
  streamType: { 
    type: String, 
    required: true, 
    enum: ["LongTerm", "PUC"] 
  },
  campus: { 
    type: String, 
    required: function() { return this.streamType === "LongTerm"; } 
  },
  section: { 
    type: String, 
    required: function() { return this.streamType === "PUC"; } 
  },
  studentCount: { 
    type: Number, 
    required: true 
  },
  responseCount: { 
    type: Number, 
    required: true 
  },
  questions: [questionSchema],
  optionACount: { 
    type: Number, 
    default: 0 
  },
  optionBCount: { 
    type: Number, 
    default: 0 
  },
  optionCCount: { 
    type: Number, 
    default: 0 
  },
  optionDCount: { 
    type: Number, 
    default: 0 
  },
  noResponseCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("FeedbackData", feedbackDataSchema);