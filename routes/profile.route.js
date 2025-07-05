const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");

// Create Profile
router.post("/api/createprofile", profileController.createProfile);

// Get All Profiles
router.get("/api/getallprofiles", profileController.getAllProfiles);

// Get Profile by Username
router.get("/api/getprofile/:userid", profileController.getProfileByUser);

// Update Profile by Username
router.put("/api/updateprofile/:userid", profileController.updateProfile);

// Delete Profile by Username
router.delete("/api/deleteprofile/:userid", profileController.deleteProfile);

// S3 Upload & View URLs
router.get("/api/getuploadurl/:idnumber", profileController.getProfileUploadURL);
router.get("/api/viewprofileimage/:idnumber", profileController.getProfileViewURL);

// Update Only Image URL
router.put("/api/updateprofileimageurl/:userid", profileController.updateProfileImageUrl);

module.exports = router;