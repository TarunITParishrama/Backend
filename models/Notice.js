const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    dropDate: {
      type: Date,
      required: [true, "Drop date is required"],
    },

    dropTime: {
      type: String,
      required: [true, "Drop time is required"],
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please enter a valid time in HH:MM format",
      ],
    },

    // Multiple campuses can receive the same notice
    campuses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campus",
        required: true,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "expired"],
      default: "scheduled",
    },
  },
  {
    // Automatically maintains createdAt and updatedAt
    timestamps: true,
  },
);

// Indexes for efficient querying
noticeSchema.index({ dropDate: 1, status: 1 });
noticeSchema.index({ campuses: 1, status: 1 });

// Pre-save hook to determine whether the notice should be active
noticeSchema.pre("save", function (next) {
  const now = new Date();

  if (this.dropDate && this.dropTime) {
    const [hours, minutes] = this.dropTime.split(":").map(Number);

    const dropDateTime = new Date(this.dropDate);
    dropDateTime.setHours(hours, minutes, 0, 0);

    if (dropDateTime <= now) {
      this.status = "active";
    } else {
      this.status = "scheduled";
    }
  }

  next();
});

module.exports = mongoose.model("Notice", noticeSchema);
