const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

// Bulk attendance operations
router.post('/api/createbulkattendance', attendanceController.createBulkAttendance);
router.get('/api/getbulkattendance', attendanceController.getBulkAttendance);

// Individual student attendance
router.get('/api/getattendance/:regNumber', attendanceController.getStudentAttendance);

module.exports = router;