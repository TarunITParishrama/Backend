const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    admissionYear: {
      type: Number,
      required: true,
      min: 2022,
      max: 2028,
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Boy", "Girl"],
    },
    admissionType: {
      type: String,
      required: true,
      enum: ["Residential", "Semi-Residential", "Non-Residential"],
    },
    regNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{6}$/,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      index: true,
    },
    studentImageURL: {
      type: String,
    },
    allotmentType: {
      type: String,
      required: true,
      enum: ["11th PUC", "12th PUC", "LongTerm"],
    },
    section: {
      type: String,
      required: true,
      index: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    fatherMobile: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },
    emailId: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
    },
    address: {
      type: String,
      required: true,
      maxlength: 500,
    },
    contact: {
      type: String,
      match: /^\d{10}$/,
    },
    medicalIssues: {
      type: String,
      default: "No",
    },
    medicalDetails: {
      type: String,
      maxlength: 200,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ admissionYear: 1, campus: 1 });
studentSchema.index({ studentName: 1, regNumber: 1, section: 1 });
studentSchema.index({ regNumber: 1, dateOfBirth: 1 });

module.exports = mongoose.model("Student", studentSchema);
