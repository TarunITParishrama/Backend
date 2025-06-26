const mongoose = require("mongoose");

const patternSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["LongTerm", "PUC"],
    },
    testName: {
      type: String,
      required: true,
    },
    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        totalQuestions: {
          type: Number,
          required: true,
        },
        totalMarks: {
          type: Number,
          required: true,
        },
      },
    ],
    totalMarks: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

patternSchema.index({ type: 1, testName: 1 }, { unique: true });

module.exports = mongoose.model("Pattern", patternSchema);
