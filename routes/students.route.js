const express = require('express')
const router = express.Router()
const studentController = require('../controllers/students.controller')
const authController = require('../middleware/auth.middleware')
//const upload = require('../utils/uploadStudentImage')

// Student CRUD routes
router.post("/api/createstudent", studentController.createStudent)
router.post("/api/bulkcreatestudents", studentController.bulkCreateStudents);
router.get("/api/getstudents", studentController.getAllStudents)
router.get("/api/getstudentbyreg/:regNumber",authController.protect, studentController.getStudentByRegNumber);
router.put("/api/updatestudent/:id", studentController.updateStudent);
router.get("/api/searchstudents", studentController.searchStudents);
router.get("/api/checkregnumber/:regNumber", studentController.checkRegNumber);
router.delete("/api/deletestudent/:id", studentController.deleteStudent);
router.get("/api/getstudentsbycampus/:campusId", studentController.getStudentsByCampus);

// Image upload route
router.get("/api/generate-image-upload-url/:regNumber/:fileExtension", studentController.generateImageUploadURL);
router.get("/api/checkregnumber/:regNumber", studentController.checkRegNumber);


module.exports = router