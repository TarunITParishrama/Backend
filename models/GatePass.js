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
    imageURL: {
      type: String,
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
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

module.exports = mongoose.model("GatePass", gatePassSchema);