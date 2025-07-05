const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    username: {
      type: String, 
      required: true,
      unique: true,
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },
    contactNumber: {
      type: String,
      match: /^\d{10}$/,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
profileSchema.index({ idNumber: 1, role: 1 });

module.exports = mongoose.model("Profile", profileSchema);
