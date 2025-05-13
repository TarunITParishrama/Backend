const GatePass = require('../models/GatePass');
const Student = require('../models/Students');
const { 
  generateUploadURL, 
  generateViewURL,
  fileExists,
  deleteFile,
  generateGatePassUploadURL,
  generateGatePassViewURL
} = require('../utils/s3.js');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const path = require('path');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper function to generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get student details by regNumber
exports.getStudentDetails = async (req, res) => {
  try {
    const student = await Student.findOne({ regNumber: req.params.regNumber }).populate('campus');
    
    if (!student) {
      return res.status(404).json({ 
        status: "error", 
        message: "Student not found" 
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        campus: student.campus,
        studentRegNumber: student.regNumber,
        studentName: student.studentName,
        parentName: student.fatherName,
        parentMobile: student.fatherMobile
      }
    });
  } catch (error) {
    res.status(400).json({ 
      status: "error", 
      message: error.message 
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
        message: "Channel is required (sms/whatsapp/email)" 
      });
    }

    switch (channel) {
      case 'sms':
        if (!mobile) {
          return res.status(400).json({ 
            status: "error", 
            message: "Mobile number is required for SMS" 
          });
        }
        await client.messages.create({
          body: `Your Gate Pass OTP is ${otp}`,
          from: '+919353980418',
          to: `+91${mobile}`
        });
        break;

      case 'whatsapp':
        if (!mobile) {
          return res.status(400).json({ 
            status: "error", 
            message: "Mobile number is required for WhatsApp" 
          });
        }
        await client.messages.create({
          body: `Your Gate Pass OTP is ${otp}`,
          from: 'whatsapp:+919353980418',
          to: `whatsapp:+91${mobile}`
        });
        break;

      case 'email':
        if (!email) {
          return res.status(400).json({ 
            status: "error", 
            message: "Email is required" 
          });
        }
        await transporter.sendMail({
          from: '"Parishrama Group" <it35.parishrama@gmail.com>',
          to: email,
          subject: 'Your Gate Pass OTP',
          text: `Your Gate Pass OTP is ${otp}. Kindly do not share with anyone.\n\nThankyou, We'd love to see you soon.\n\nWarm Regards,\nParishrama Group of institutions`,
          html: `
            <p>Your Gate Pass OTP is <strong>${otp}</strong>. Kindly do not share with anyone.</p>
            <p>Thankyou, We'd love to see you soon.</p>
            <p>Warm Regards,<br>Parishrama Group of institutions</p>
          `
        });
        break;

      default:
        return res.status(400).json({ 
          status: "error", 
          message: "Invalid channel" 
        });
    }

    res.status(200).json({ 
      status: "success", 
      otp, // For development only
      message: `OTP sent via ${channel}` 
    });

  } catch (error) {
    console.error('OTP send error:', error);
    res.status(400).json({ 
      status: "error", 
      message: `Failed to send OTP via ${req.body.channel}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate image upload URL for gate pass
exports.generateGatePassImageUploadURL = async (req, res) => {
  try {
    const { regNumber, fileExtension } = req.params;
    const ext = fileExtension || '.jpg';
    
    const uploadURL = await generateGatePassUploadURL(`gatepasses/${regNumber}`, ext);
    const viewURL = await generateGatePassViewURL(`gatepasses/${regNumber}`, ext);
    
    res.status(200).json({ 
      status: "success", 
      uploadURL,
      viewURL
    });
  } catch (error) {
    res.status(400).json({ 
      status: "error", 
      message: error.message 
    });
  }
};

// Create a new gate pass
exports.createGatePass = async (req, res) => {
  try {
    const gatePass = await GatePass.create(req.body);
    
    res.status(201).json({ 
      status: "success", 
      data: gatePass 
    });
  } catch (error) {
    res.status(400).json({ 
      status: "error", 
      message: error.message 
    });
  }
};

// Get all gate passes (for staff view)
exports.getAllGatePasses = async (req, res) => {
  try {
    const gatePasses = await GatePass.find()
      .populate('campus', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      status: "success", 
      data: gatePasses 
    });
  } catch (error) {
    res.status(400).json({ 
      status: "error", 
      message: error.message 
    });
  }
};

// Get gate passes by student regNumber (for parent view)
exports.getGatePassesByStudent = async (req, res) => {
  try {
    const gatePasses = await GatePass.find({ studentRegNumber: req.params.regNumber })
      .populate('campus', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      status: "success", 
      data: gatePasses 
    });
  } catch (error) {
    res.status(400).json({ 
      status: "error", 
      message: error.message 
    });
  }
};