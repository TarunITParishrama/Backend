const mongoose = require('mongoose');

const theoryTestSchema = new mongoose.Schema({
  stream: {
    type: String,
    required: true,
    enum: ['LongTerm', 'PUC']
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  studentResults: [{
    regNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v);
        },
        message: props => `${props.value} is not a valid 6-digit registration number!`
      }
    },
    subjectMarks: {
      physics: { type: Number, default: 0 },
      chemistry: { type: Number, default: 0 },
      biology: { type: Number, default: 0 },
      mathematics: { type: Number, default: 0 }
    },
    totalMarks: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
theoryTestSchema.index({ stream: 1, testName: 1 });
theoryTestSchema.index({ 'studentResults.regNumber': 1 });

const TheoryTest = mongoose.model('TheoryTest', theoryTestSchema);

module.exports = TheoryTest;