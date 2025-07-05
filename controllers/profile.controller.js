const Profile = require("../models/Profile");
const User = require("../models/UserModel");
const { generateProfileUploadURL, generateProfileViewURL } = require("../utils/s3");

// Create Profile
exports.createProfile = async (req, res) => {
  try {
    const { username } = req.body;

    const existingUser = await User.findOne({ phonenumber: username });
    if (!existingUser) {
      return res.status(400).json({ message: "User with given phone number not found" });
    }

    const existingProfile = await Profile.findOne({ username });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this user" });
    }

    const profile = new Profile(req.body);
    await profile.save();

    res.status(201).json({ message: "Profile created successfully", data: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json({ data: profiles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Profile by Username
exports.getProfileByUser = async (req, res) => {
  try {
    const { userid } = req.params;
    const profile = await Profile.findOne({ username: userid });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ data: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userid } = req.params;
    const profile = await Profile.findOneAndUpdate({ username: userid }, req.body, {
      new: true,
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Profile updated", data: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Profile
exports.deleteProfile = async (req, res) => {
  try {
    const { userid } = req.params;
    const deleted = await Profile.findOneAndDelete({ username: userid });

    if (!deleted) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Profile deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate Signed Upload URL
exports.getProfileUploadURL = async (req, res) => {
  try {
    const { idnumber } = req.params;
    const url = await generateProfileUploadURL(idnumber);
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate Signed View URL
exports.getProfileViewURL = async (req, res) => {
  try {
    const { idnumber } = req.params;
    const viewURL = await generateProfileViewURL(idnumber);
    res.status(200).json({ url: viewURL });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Only Image URL
exports.updateProfileImageUrl = async (req, res) => {
  try {
    const { userid } = req.params;
    const { imageUrl } = req.body;

    const profile = await Profile.findOneAndUpdate(
      { username: userid },
      { imageUrl },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Image URL updated", data: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
