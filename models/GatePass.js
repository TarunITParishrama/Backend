const mongoose = require("mongoose");

const gatePassSchema = new mongoose.Schema(
  {
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true
    },
    studentRegNumber: {
      type: String,
      required: true,
      match: /^\d{6}$/
    },
    studentName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    time: {
      type: String,
      required: true
    },
    parentName: {
      type: String,
      required: true
    },
    parentMobile: {
      type: String,
      required: true,
      match: /^\d{10}$/
    },
    escorterName: {
      type: String,
      required: true
    },
    escorterMobile: {
      type: String,
      required: true,
      match: /^\d{10}$/
    },
    wardenName: {
      type: String,
      required: true
    },
    imageKey: {  
      type: String,
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    passType: {  
      type: String,
      enum: ['check-out', 'check-in'],
      required: true
    },
    relatedPass: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GatePass'
    },
    checkInTime: {  
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'], 
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
gatePassSchema.index({ studentRegNumber: 1 });
gatePassSchema.index({ date: 1 });
gatePassSchema.index({ parentMobile: 1 });
gatePassSchema.index({ passType: 1 });
gatePassSchema.index({ status: 1 });

module.exports = mongoose.model('GatePass', gatePassSchema);
