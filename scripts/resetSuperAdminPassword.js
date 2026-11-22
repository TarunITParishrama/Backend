const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

async function resetPassword() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const newPassword = process.env.SUPER_ADMIN_NEW_PASSWORD;
    const phoneNumber = "9353980418";

    if (!mongoUrl) {
      throw new Error("MONGO_URL is missing from backend/.env");
    }

    if (!newPassword || newPassword.length < 12) {
      throw new Error(
        "Set SUPER_ADMIN_NEW_PASSWORD to a password of at least 12 characters."
      );
    }

    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB.");

    const user = await User.findOne({
      phonenumber: phoneNumber,
    }).select("+password");

    if (!user) {
      throw new Error("Super admin user not found.");
    }

    if (user.role !== "super_admin") {
      throw new Error("The selected account is not a super admin.");
    }

    // Assign the plain-text password.
    // UserModel's pre-save hook will hash it automatically.
    user.password = newPassword;
    await user.save();

    // Verify the password against the saved hash.
    const updatedUser = await User.findById(user._id)
      .select("+password");

    if (!updatedUser) {
      throw new Error("Could not retrieve the updated user.");
    }

    const passwordMatches = await bcrypt.compare(
      newPassword,
      updatedUser.password
    );

    if (!passwordMatches) {
      throw new Error(
        "Password verification failed after saving."
      );
    }

    console.log(
      "Super admin password updated and verified successfully."
    );
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

resetPassword();
