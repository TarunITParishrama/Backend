const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");

// SignUp with JWT token generation
exports.newSignup = async function (req, res) {
  try {
    // Create new user
    const newUser = await User.create(req.body);

    // Create JWT token payload
    const tokenPayload = {
      id: newUser._id,
      phonenumber: newUser.phonenumber,
      // You can add more user data here if needed, but avoid sensitive info
    };

    // Generate JWT token
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET, // Store this in your environment variables
      { expiresIn: process.env.JWT_EXPIRES_IN || "180d" } // Token expiration
    );

    // Remove password from output (even if it's hashed)
    newUser.password = undefined;

    res.status(201).json({
      status: "Success",
      token, // Send the token to the client
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    // Improved error handling
    let errorMessage = "Error while signing up";

    // Handle duplicate phone number error
    if (err.code === 11000 && err.keyPattern.phonenumber) {
      errorMessage = "Phone number already exists";
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      errorMessage = Object.values(err.errors)
        .map((el) => el.message)
        .join(". ");
    }

    res.status(400).json({
      status: "error",
      message: errorMessage,
    });
  }
};

// Login with JWT token generation
exports.newlogin = async function (req, res) {
  try {
    const { phonenumber, password } = req.body;

    // 1) Check if phoneNumber and password exist
    if (!phonenumber || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide phone number and password",
      });
    }

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ phonenumber }).select(
      "+password +approval"
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect phone number or password",
      });
    }

    // 3) Check if user is approved
    if (!user.approval) {
      return res.status(403).json({
        status: "error",
        message: "Your account is pending approval from admin",
      });
    }

    // 4) If everything is ok, generate token
    const tokenPayload = {
      id: user._id,
      phoneNumber: user.phonenumber,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    });

    // 5) Remove sensitive data from output
    user.password = undefined;
    user.approval = undefined;

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          role: user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error while logging in",
    });
  }
};

// Get all users (for admin dashboard)
exports.getAllUsers = async function (req, res) {
  try {
    // Only allow admins to access this endpoint
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching users",
    });
  }
};

// Update user approval status
exports.updateApproval = async function (req, res) {
  try {
    const { userId } = req.params;
    const { approval } = req.body;

    // Only allow admins to approve users
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { approval },
      { new: true, select: "-password" } // Return updated user without password
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error updating approval status",
    });
  }
};

// Update user role
exports.updateRole = async function (req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Only super admin can change roles
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error updating user role",
    });
  }
};

// Delete user
exports.deleteUser = async function (req, res) {
  try {
    const { userId } = req.params;

    // Only super admin can delete users
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error deleting user",
    });
  }
};
