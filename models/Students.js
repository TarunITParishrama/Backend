const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    admissionYear: {
      type: Number,
      required: true,
      min: 2024,
      max: 2028
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['Boy', 'Girl']
    },
    admissionType: {
      type: String,
      required: true,
      enum: ['Residential', 'Semi-Residential', 'Non-Residential']
    },
    regNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{6}$/, // 6 digit number validation
      index: true // Added index for faster queries
    },
    studentName: {
      type: String,
      required: true,
      index: true // Added index for faster name searches
    },
    studentImageURL: {
      type: String
    },
    allotmentType: {
      type: String,
      required: true,
      enum: ['PUC', 'LongTerm']
    },
    section: {
      type: String,
      required: true,
      index: true
    },
    fatherName: {
      type: String,
      required: true
    },
    fatherMobile: {
      type: String,
      required: true,
      match: /^\d{10}$/ // 10 digit mobile number validation
    },
    address: {
      type: String,
      required: true,
      maxlength: 500
    },
    contact: {
      type: String,
      match: /^\d{10}$/
    },
    medicalIssues: {
      type: String,
      default: 'Nil'
    }
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ admissionYear: 1, campus: 1 });
studentSchema.index({ studentName: 1, regNumber: 1, section: 1 });

module.exports = mongoose.model("Student", studentSchema);