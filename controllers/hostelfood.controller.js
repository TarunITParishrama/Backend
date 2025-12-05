const HostelFood = require("../models/HostelFood");

exports.createFood = async (req, res) => {
  try {
    const data = await HostelFood.create(req.body);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.getAllFood = async (req, res) => {
  try {
    const data = await HostelFood.find().populate("campusId", "name");
    res.status(200).json({ status: "success", data });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Get food menu for a campus (optionally for a specific day)
exports.getFoodForCampus = async (req, res) => {
  try {
    const { campusId } = req.params;
    const { day } = req.query; // optional: Sunday / Monday / ...

    const query = { campusId };
    if (day) query.day = day;

    const data = await HostelFood.find(query).populate("campusId", "name"); // so frontend can show campus name

    res.status(200).json({ status: "success", data });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const data = await HostelFood.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    await HostelFood.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "success", message: "Deleted" });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};
