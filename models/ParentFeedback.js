// models/ParentFeedback.js
const mongoose = require("mongoose");

const ParentFeedbackSchema = new mongoose.Schema(
  {
    regNumber: { type: String, index: true },
    studentName: { type: String, required: true },
    mobile: { type: String, required: true },
    campusName: { type: String, required: true },
    message: { type: String, required: true, minlength: 200 },
    status: { type: String, enum: ["new", "read", "archived"], default: "new" },
    createdBy: { type: String }, // optional email/id of parent user if available
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParentFeedback", ParentFeedbackSchema);
