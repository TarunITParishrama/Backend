const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Students = require("../models/Students");

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in",
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists (for staff) or if it's a parent token
    if (decoded.role === "parent") {
      // For parent tokens, we just verify the token is valid
      req.parent = decoded;
    } else {
      // For staff users, verify they exist in the database
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          status: "error",
          message: "User no longer exists",
        });
      }
      req.user = currentUser;
    }

    // 4) Grant access
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You don't have permission to perform this action",
      });
    }
    next();
  };
};

exports.parentLogin = async function (req, res) {
  try {
    const { regNumber, dob } = req.body;

    // Validate input
    if (!regNumber || !dob) {
      return res.status(400).json({
        status: "error",
        message: "Please provide registration number and date of birth",
      });
    }

    // Parse date (accepts DD-MM-YYYY)
    const [day, month, year] = dob.split("-").map(Number);
    const dobDate = new Date(year, month - 1, day);

    // Find student
    const student = await Students.findOne({ regNumber });
    if (!student) {
      return res.status(401).json({
        status: "error",
        message: "Invalid registration number",
      });
    }

    // Compare dates (ignore time component)
    const studentDOB = new Date(student.dateOfBirth);
    if (
      dobDate.getDate() !== studentDOB.getDate() ||
      dobDate.getMonth() !== studentDOB.getMonth() ||
      dobDate.getFullYear() !== studentDOB.getFullYear()
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid date of birth",
      });
    }

    // Create token payload
    const tokenPayload = {
      id: student._id,
      regNumber: student.regNumber,
      role: "parent", // This is a virtual role, not stored in DB
    };

    // Generate token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    });

    // Return success with token
    res.status(200).json({
      status: "success",
      token,
      data: {
        student: {
          name: student.studentName,
          regNumber: student.regNumber,
          section: student.section,
          stream: student.allotmentType,
          dateOfBirth: student.dateOfBirth,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error during parent login",
    });
  }
};

exports.authenticateParent = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in",
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if this is a parent token
    if (decoded.role !== "parent") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token type",
      });
    }

    // 4) Grant access
    req.parent = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};
