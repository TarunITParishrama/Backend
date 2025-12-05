const mongoose = require("mongoose");

const hostelFoodSchema = new mongoose.Schema({
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: "Campus", required: true },
  day: { type: String, required: true },
  session: { type: String, required: true },
  dishes: { type: [String], required: true },
  timeSlot: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("HostelFood", hostelFoodSchema);
