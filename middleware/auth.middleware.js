const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in"
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "User no longer exists"
      });
    }

    // 4) Grant access
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: "error",
      message: "Invalid token"
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You don't have permission to perform this action"
      });
    }
    next();
  };
};