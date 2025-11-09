const express = require("express");
const router = express.Router();
const studentController = require("../controllers/students.controller");
const authController = require("../middleware/auth.middleware");
const Student=require("../models/Students")
//const upload = require('../utils/uploadStudentImage')

// Student CRUD routes
router.post("/api/createstudent", studentController.createStudent);
router.post("/api/bulkcreatestudents", studentController.bulkCreateStudents);
router.get("/api/getstudents", studentController.getAllStudents);
router.get(
  "/api/getstudentbyreg/:regNumber",
  authController.protect,
  studentController.getStudentByRegNumber
);
router.put("/api/updatestudent/:id", studentController.updateStudent);
router.get("/api/searchstudents", studentController.searchStudents);
router.get("/api/checkregnumber/:regNumber", studentController.checkRegNumber);
router.delete("/api/deletestudent/:id",authController.protect, studentController.deleteStudent);
router.delete(
  "/api/delete-student-image/:regNumber",
  studentController.deleteStudentImage
);
router.get('/api/deleted-students', authController.protect, authController.restrictTo('admin','super_admin'), studentController.getDeletedStudents);
router.get('/api/deleted-students/:id', authController.protect, authController.restrictTo('admin','super_admin'), studentController.getDeletedStudentById);
router.get('/api/deleted-student-by-reg/:regNumber', authController.protect, studentController.getDeletedStudentByReg);
router.get(
  "/api/getstudentsbycampus/:campusId",
  studentController.getStudentsByCampus
);
router.get(
  "/api/download-student-template",
  studentController.downloadTemplate
);

// Image upload route
router.get(
  "/api/generate-image-upload-url/:regNumber/:fileExtension",
  studentController.generateImageUploadURL
);
router.get("/api/byreg/:regNumber", studentController.getByReg);
router.get("/api/checkregnumber/:regNumber", studentController.checkRegNumber);
router.post("/api/check-missing-regnumbers", async (req, res) => {
  const { regNumbers } = req.body;
  const existing = await Student.find({
    regNumber: { $in: regNumbers },
  }).select("regNumber");
  const existingSet = new Set(existing.map((s) => s.regNumber));
  const missing = regNumbers.filter((r) => !existingSet.has(r));
  res.json({ missing });
});

module.exports = router;
