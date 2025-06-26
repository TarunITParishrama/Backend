const express = require("express");
const router = express.Router();
const gatePassController = require("../controllers/gatepass.controller");
const authController = require("../middleware/auth.middleware");

// Student details fetch
router.get(
  "/api/getstudentdetails/:regNumber",
  gatePassController.getStudentDetails
);

// OTP and Gate Pass generation
router.post("/api/sendotp", gatePassController.sendOTP);
router.get(
  "/api/generate-gatepass-upload-url/:regNumber/:passType/:fileExtension",
  gatePassController.generateGatePassImageUploadURL
);
router.post("/api/creategatepass", gatePassController.createGatePass);

// View gate passes
router.get(
  "/api/getallgatepasses",
  authController.protect,
  gatePassController.getAllGatePasses
);
router.get(
  "/api/getgatepassesbystudent/:regNumber",
  authController.protect,
  gatePassController.getGatePassesByStudent
);
router.get(
  "/api/getactivecheckoutpasses",
  authController.protect,
  gatePassController.getActiveCheckOutPasses
);

module.exports = router;
