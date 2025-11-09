const ParentFeedback = require("../models/ParentFeedback");
const nodemailer = require("nodemailer");

const FROM_EMAIL = "it35.parishrama@gmail.com";
const TO_EMAIL = "feedbacksparishrama@gmail.com";
const TO_EMAIL_CC = "";
const TO_EMAIL_BCC = "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: FROM_EMAIL,
    pass: process.env.EMAIL_PASSWORD, 
  },
});

const feedbackMail = (doc) => ({
  from: `"Parishrama Feedback" <${FROM_EMAIL}>`,
  to: TO_EMAIL,
  cc: TO_EMAIL_CC,
  bcc: TO_EMAIL_BCC,
  subject: `Parent Feedback for ${doc.studentName} (${doc.regNumber || "no-reg"})`,
  text: [
    `Student Name: ${doc.studentName}`,
    `Reg Number: ${doc.regNumber || "-"}`,
    `Campus Name: ${doc.campusName}`,
    `Mobile: ${doc.mobile}`,
    "",
    "Message:",
    doc.message,
  ].join("\n"),
  html: `
    <p><strong>Student Name:</strong> ${doc.studentName}</p>
    <p><strong>Reg Number:</strong> ${doc.regNumber || "-"}</p>
    <p><strong>Mobile:</strong> ${doc.mobile}</p>
    <p><strong>Campus Name:</strong> ${doc.campusName}</p>
    <hr/>
    <p style="white-space:pre-wrap">${doc.message}</p>
  `,
});

// CREATE
exports.create = async (req, res) => {
  try {
    const { regNumber, studentName,campusName, mobile, message } = req.body;
    if (!studentName || !mobile || !message) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }
    if (String(message).trim().length < 200) {
      return res.status(400).json({ status: "error", message: "Message must be at least 200 characters" });
    }

    const doc = await ParentFeedback.create({
      regNumber,
      studentName,
      mobile,
      campusName,
      message,
      createdBy: req.user?.email || req.user?.id, // if you attach user
    });

    // Send email (non-blocking but await ensures error surface)
    await transporter.sendMail(feedbackMail(doc));

    return res.status(201).json({ status: "success", data: doc, message: "Feedback sent" });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// READ (list with filters)
exports.list = async (req, res) => {
  try {
    const { q, status, regNumber } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (regNumber) filter.regNumber = regNumber;
    if (q) filter.$or = [
      { studentName: new RegExp(q, "i") },
      { mobile: new RegExp(q, "i") },
      { campusName: new RegExp(q, "i") },
      { message: new RegExp(q, "i") },
    ];
    const items = await ParentFeedback.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ status: "success", data: items });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// READ one
exports.get = async (req, res) => {
  try {
    const item = await ParentFeedback.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "Not found" });
    return res.status(200).json({ status: "success", data: item });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// UPDATE (status or message correction)
exports.update = async (req, res) => {
  try {
    const { status, message } = req.body;
    const payload = {};
    if (status) payload.status = status;
    if (message) {
      if (String(message).trim().length < 200) {
        return res.status(400).json({ status: "error", message: "Message must be at least 200 characters" });
      }
      payload.message = message;
    }
    const item = await ParentFeedback.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!item) return res.status(404).json({ status: "error", message: "Not found" });
    return res.status(200).json({ status: "success", data: item });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const item = await ParentFeedback.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "Not found" });
    return res.status(200).json({ status: "success", message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
