const mongoose = require('mongoose');

const StudentReportSchema = new mongoose.Schema({
    regNumber: { 
        type: String, 
        required: true 
    },
    stream: { 
        type: String, 
        enum: ['LongTerm', 'PUC'], 
        required: true 
    },
    testName: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    marksType: { 
        type: String, 
        required: true 
    },
    totalQuestions: { 
        type: Number, 
        required: true 
    },
    correctAnswers: { 
        type: Number, 
        required: true 
    },
    wrongAnswers: { 
        type: Number, 
        required: true 
    },
    unattempted: { 
        type: Number, 
        required: true 
    },
    accuracy: { 
        type: Number, 
        required: true 
    }, 
    percentage:{
        type: Number,
        required: true
    },
    totalMarks: { 
        type: Number, 
        required: true 
    },
    percentile: {
        type: Number, 
        required: true 
    },
    responses: [{
        questionNumber: { 
            type: Number, 
            required: true 
        },
        markedOption: { 
            type: String 
        }, 
        correctOption: { 
            type: [String], 
            required: true 
        },
        isCorrect: { 
            type: Boolean, 
            required: true 
        }
    }]
}, { 
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: 'version'
  });

StudentReportSchema.index({ regNumber: 1 });
StudentReportSchema.index({ testName: 1 });
StudentReportSchema.index({ stream: 1 });
StudentReportSchema.index(
    { 
      regNumber: 1, 
      testName: 1, 
      stream: 1, 
      date: 1 
    }, 
    { 
      unique: true,
      partialFilterExpression: {
        regNumber: { $exists: true },
        testName: { $exists: true },
        stream: { $exists: true },
        date: { $exists: true }
      }
    }
  );
StudentReportSchema.index({ stream: 1, testName: 1 }); 
StudentReportSchema.index({ date: 1, stream: 1 }); 

module.exports = mongoose.model('StudentReport', StudentReportSchema);