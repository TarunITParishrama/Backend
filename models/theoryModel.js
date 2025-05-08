const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Biology', 'Mathematics']
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  }
});

const theoryTestSchema = new mongoose.Schema({
  stream: {
    type: String,
    required: true,
    enum: ['LongTerm', 'PUC'],
    default: 'PUC'
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
  subjectDetails: {
    type: [subjectSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 4; // Ensure exactly 4 subjects
      },
      message: 'Exactly 4 subjects are required'
    }
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
      type: Map,
      of: Number,
      required: true
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