const Attendance = require("../models/Attendance");
const Student = require("../models/Students");
const Subject = require("../models/Subjects");

// Create bulk attendance
exports.createBulkAttendance = async (req, res) => {
  try {
    const { attendanceData } = req.body;

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Attendance data array is required",
      });
    }

    // Validate all students exist first
    const regNumbers = attendanceData.map((a) => a.regNumber);
    const students = await Student.find({ regNumber: { $in: regNumbers } });

    if (students.length !== attendanceData.length) {
      const missingRegNumbers = attendanceData
        .filter((a) => !students.some((s) => s.regNumber === a.regNumber))
        .map((a) => a.regNumber);

      return res.status(400).json({
        status: "error",
        message: "Some students not found",
        missingRegNumbers,
      });
    }

    // Prepare attendance records with student details
    const attendanceRecords = attendanceData.map((record) => {
      const student = students.find((s) => s.regNumber === record.regNumber);
      return {
        ...record,
        studentName: student.studentName,
        section: student.section,
        campus: student.campus,
      };
    });

    // Insert all records
    const createdAttendance = await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      status: "success",
      count: createdAttendance.length,
      data: createdAttendance,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get bulk attendance (filter by section, campus, date range)
exports.getBulkAttendance = async (req, res) => {
  try {
    const { section, campus, startDate, endDate, subject } = req.query;

    let query = {};

    if (section) query.section = section;
    if (campus) query.campus = campus;
    if (subject) query.subject = subject;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate("campus", "name")
      .populate("subject", "subjectName")
      .sort({ date: -1, section: 1, studentName: 1 });

    res.status(200).json({
      status: "success",
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get attendance for a specific student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const { startDate, endDate, subject } = req.query;

    let query = { regNumber };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (subject) query.subject = subject;

    const attendance = await Attendance.find(query)
      .populate("campus", "name")
      .populate("subject", "subjectName")
      .sort({ date: -1 });

    res.status(200).json({
      status: "success",
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};
