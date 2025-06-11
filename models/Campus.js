const mongoose = require("mongoose");

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Boys', 'Girls', 'Co-ed']
    },
    location: {
      type: String,
      required: true,
      maxlength: 300
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Campus", campusSchema);