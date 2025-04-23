const express = require("express");
const studentReportController = require("../controllers/studentreport.controller");
const router = express.Router();

// Student Report CRUD Endpoints
router.post("/api/createstudentreports", studentReportController.createOrUpdateStudentReport);
router.post("/api/checkexistingreports", studentReportController.checkExistingReports);
router.post("/api/bulkstudentreports", studentReportController.bulkCreateOrUpdateStudentReports);
router.get("/api/getstudentreports", studentReportController.getStudentReports);
router.get("/api/getstudentreportsbyid/:id", studentReportController.getStudentReportById);
router.get('/api/getstudentreportbystudentid/:regNumber', studentReportController.getStudentReportByStudentId);
router.put("/api/updatestudentreportsbyid/:id", studentReportController.updateStudentReport);
router.delete("/api/deletestudentreportsbyid/:id", studentReportController.deleteStudentReport);

module.exports = router;