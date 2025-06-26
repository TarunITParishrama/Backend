const Notice = require("../models/Notice");
const cron = require("node-cron");

// Schedule job to activate notices at their drop time
cron.schedule("* * * * *", async () => {
  // Runs every minute
  const now = new Date();
  await Notice.updateMany(
    {
      dropDate: { $lte: now },
      status: "scheduled",
    },
    { status: "active" }
  );
});

// Create a new notice
exports.createNotice = async (req, res) => {
  try {
    const { subject, message, dropDate, dropTime } = req.body;

    const notice = await Notice.create({
      subject,
      message,
      dropDate,
      dropTime,
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: "success",
      data: notice,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get active notices (for parents)
exports.getActiveNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ status: "active" })
      .sort("-dropDate")
      .populate("createdBy", "name role");

    res.status(200).json({
      status: "success",
      results: notices.length,
      data: notices,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all notices (for admin/staff)
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort("-createdAt")
      .populate("createdBy", "name role");

    res.status(200).json({
      status: "success",
      results: notices.length,
      data: notices,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete a notice
exports.deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
