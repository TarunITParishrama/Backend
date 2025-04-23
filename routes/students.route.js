const express = require('express')
const router = express.Router()
const studentController = require('../controllers/students.controller')

// Student CRUD routes
router.post("/api/createstudent", studentController.createStudent)
router.get("/api/getstudents", studentController.getAllStudents)
router.get("/api/getstudentbyreg/:regNumber", studentController.getStudentByRegNumber);
router.put("/api/updatestudent/:id", studentController.updateStudent);
router.get("/api/searchstudents", studentController.searchStudents);

router.get("/api/checkregnumber/:regNumber", studentController.checkRegNumber);
router.delete("/api/deletestudent/:id", studentController.deleteStudent);
router.get("/api/getstudentsbycampus/:campusId", studentController.getStudentsByCampus)

module.exports = router