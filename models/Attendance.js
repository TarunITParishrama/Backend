const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      ref: "Student",
    },
    studentName: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    present: {
      type: Boolean,
      default: false,
    },
    absent: {
      type: Boolean,
      default: false,
    },
    forgiven: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
attendanceSchema.index({ regNumber: 1, date: 1 });
attendanceSchema.index({ section: 1, campus: 1, date: 1 });
attendanceSchema.index({ subject: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
