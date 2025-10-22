const mongoose = require("mongoose");

const deletedStudentSchema = new mongoose.Schema(
  {
    // snapshot of student
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
      required: true,
    }, // original _id
    admissionYear: { type: Number, required: true, min: 2022, max: 2028 },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    gender: { type: String, required: true, enum: ["Boy", "Girl"] },
    admissionType: {
      type: String,
      required: true,
      enum: ["Residential", "Semi-Residential", "Non-Residential"],
    },
    regNumber: { type: String, required: true, index: true },
    dateOfBirth: { type: Date, required: true },
    studentName: { type: String, required: true, index: true },
    studentImageURL: { type: String },
    allotmentType: {
      type: String,
      required: true,
      enum: ["11th PUC", "12th PUC", "LongTerm"],
    },
    section: { type: String, required: true, index: true },
    fatherName: { type: String, required: true },
    fatherMobile: { type: String },
    emailId: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, maxlength: 500 },
    contact: { type: String },
    medicalIssues: { type: String, default: "No" },
    medicalDetails: { type: String, maxlength: 200 },

    // deletion metadata
    reason: { type: String, required: true, trim: true, maxlength: 300 }, // user-entered reason
    deletedAt: { type: Date, default: Date.now, index: true },
    deletedByUsername: { type: String, required: true, trim: true }, // e.g., admin phone or username
  },
  { timestamps: true }
);

deletedStudentSchema.index({ admissionYear: 1, campus: 1 });
deletedStudentSchema.index({ regNumber: 1, dateOfBirth: 1 });
deletedStudentSchema.index({ studentName: 1, section: 1 });
deletedStudentSchema.index({ deletedAt: -1, deletedByUsername: 1 });

module.exports = mongoose.model("DeletedStudent", deletedStudentSchema);
