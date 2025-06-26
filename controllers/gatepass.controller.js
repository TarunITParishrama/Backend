const GatePass = require("../models/GatePass");
const Student = require("../models/Students");
const {
  generateUploadURL,
  generateViewURL,
  fileExists,
  deleteFile,
  generateGatePassUploadURL,
  generateGatePassViewURL,
} = require("../utils/s3.js");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const path = require("path");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate fresh image URLs
const getFreshImageURL = async (imageKey) => {
  if (!imageKey) return null;

  try {
    const extension = path.extname(imageKey);
    const viewURL = await generateGatePassViewURL(
      imageKey.replace(extension, ""),
      extension
    );
    return viewURL;
  } catch (error) {
    console.error("Error generating fresh image URL:", error);
    return null;
  }
};

// Get student details by regNumber
exports.getStudentDetails = async (req, res) => {
  try {
    const student = await Student.findOne({
      regNumber: req.params.regNumber,
    }).populate("campus");

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        campus: student.campus,
        studentRegNumber: student.regNumber,
        studentName: student.studentName,
        parentName: student.fatherName,
        parentMobile: student.fatherMobile,
        emailId: student.emailId,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { channel, mobile, email } = req.body;
    const otp = generateOTP();

    if (!channel) {
      return res.status(400).json({
        status: "error",
        message: "Channel is required (sms/whatsapp/email)",
      });
    }

    switch (channel) {
      case "sms":
        if (!mobile) {
          return res.status(400).json({
            status: "error",
            message: "Mobile number is required for SMS",
          });
        }
        await client.messages.create({
          body: `Your Gate Pass OTP is ${otp}`,
          from: "+919353980418",
          to: `+91${mobile}`,
        });
        break;

      case "whatsapp":
        if (!mobile) {
          return res.status(400).json({
            status: "error",
            message: "Mobile number is required for WhatsApp",
          });
        }
        await client.messages.create({
          body: `Your Gate Pass OTP is ${otp}`,
          from: "whatsapp:+919353980418",
          to: `whatsapp:+91${mobile}`,
        });
        break;

      case "email":
        if (!email) {
          return res.status(400).json({
            status: "error",
            message: "Email is required",
          });
        }
        await transporter.sendMail({
          from: '"Parishrama Group" <it35.parishrama@gmail.com>',
          to: email,
          subject: "Your Gate Pass OTP",
          text: `Your Gate Pass OTP is ${otp}. Kindly do not share with anyone.\n\nThankyou, We'd love to see you soon.\n\nWarm Regards,\nParishrama Group of institutions`,
          html: `
            <p>Your Gate Pass OTP is <strong>${otp}</strong>. Kindly do not share with anyone.</p>
            <p>Thankyou, We'd love to see you soon.</p>
            <p>Warm Regards,<br>Parishrama Group of institutions</p>
          `,
        });
        break;

      default:
        return res.status(400).json({
          status: "error",
          message: "Invalid channel",
        });
    }

    res.status(200).json({
      status: "success",
      otp, // For development only
      message: `OTP sent via ${channel}`,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    res.status(400).json({
      status: "error",
      message: `Failed to send OTP via ${req.body.channel}`,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Generate image upload URL for gate pass
exports.generateGatePassImageUploadURL = async (req, res) => {
  try {
    const { regNumber, passType, fileExtension } = req.params;
    const ext = fileExtension || ".jpg";

    const { uploadURL, key } = await generateGatePassUploadURL(
      regNumber,
      passType,
      ext
    );
    const viewURL = await generateGatePassViewURL(key);

    res.status(200).json({
      status: "success",
      uploadURL,
      viewURL,
      imageKey: key,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create a new gate pass
exports.createGatePass = async (req, res) => {
  try {
    // For check-out passes, ensure no active check-out already exists
    if (req.body.passType === "check-out") {
      const activeCheckOut = await GatePass.findOne({
        studentRegNumber: req.body.studentRegNumber,
        passType: "check-out",
        status: { $in: ["pending", "approved"] },
      });

      if (activeCheckOut) {
        return res.status(400).json({
          status: "error",
          message: "Student already has an active check-out pass",
        });
      }

      // Since OTP is verified, auto-approve
      req.body.status = "approved";
    }

    // For check-in passes, link it to the latest approved check-out and mark it completed
    if (req.body.passType === "check-in") {
      const checkOutPass = await GatePass.findOne({
        studentRegNumber: req.body.studentRegNumber,
        passType: "check-out",
        status: "approved",
      }).sort({ createdAt: -1 });

      if (!checkOutPass) {
        return res.status(400).json({
          status: "error",
          message: "No active check-out pass found for this student",
        });
      }

      // Link and complete the check-out pass
      req.body.relatedPass = checkOutPass._id;
      checkOutPass.status = "completed";
      await checkOutPass.save();

      // Also auto-approve the check-in pass
      req.body.status = "approved";
    }

    const gatePass = await GatePass.create(req.body);

    res.status(201).json({
      status: "success",
      data: gatePass,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all gate passes (for staff view)
exports.getAllGatePasses = async (req, res) => {
  try {
    const gatePasses = await GatePass.find()
      .populate("campus", "name")
      .sort({ createdAt: -1 });

    // Add fresh image URLs to each pass
    const passesWithFreshURLs = await Promise.all(
      gatePasses.map(async (pass) => {
        const passObj = pass.toObject();
        passObj.imageURL = await getFreshImageURL(pass.imageKey);
        return passObj;
      })
    );

    res.status(200).json({
      status: "success",
      data: passesWithFreshURLs,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get gate passes by student regNumber (for parent view)
exports.getGatePassesByStudent = async (req, res) => {
  try {
    const gatePasses = await GatePass.find({
      studentRegNumber: req.params.regNumber,
    })
      .populate("campus", "name")
      .sort({ createdAt: -1 });

    // Add fresh image URLs to each pass
    const passesWithFreshURLs = await Promise.all(
      gatePasses.map(async (pass) => {
        const passObj = pass.toObject();
        passObj.imageURL = await getFreshImageURL(pass.imageKey);
        return passObj;
      })
    );

    res.status(200).json({
      status: "success",
      data: passesWithFreshURLs,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get active check-out passes
exports.getActiveCheckOutPasses = async (req, res) => {
  try {
    const passes = await GatePass.find({
      passType: "check-out",
      status: { $in: ["pending", "approved"] },
    }).populate("campus", "name");

    // Add fresh image URLs
    const passesWithFreshURLs = await Promise.all(
      passes.map(async (pass) => {
        const passObj = pass.toObject();
        passObj.imageURL = await getFreshImageURL(pass.imageKey);
        return passObj;
      })
    );

    res.status(200).json({
      status: "success",
      data: passesWithFreshURLs,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
