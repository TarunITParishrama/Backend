const DetailedReport = require("../models/DetailedReports");
const Student = require("../models/Students");

// Create DetailedReport with stream validation
exports.createDetailedReport = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      "regNumber",
      "studentName",
      "campus",
      "section",
      "stream",
      "testName",
      "date",
      "subjects",
      "overallTotalMarks",
      "fullMarks",
      "percentage",
      "percentile",
      "rank",
      "isPresent",
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body[field] && req.body[field] !== 0
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate stream
    if (!["LongTerm", "PUC"].includes(req.body.stream)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid stream value. Must be either 'LongTerm' or 'PUC'",
      });
    }

    // Validate subjects
    if (!Array.isArray(req.body.subjects) || req.body.subjects.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Subjects must be a non-empty array",
      });
    }

    // Create the report
    const report = new DetailedReport({
      ...req.body,
      date: new Date(req.body.date),
    });

    await report.save();

    res.status(201).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    console.error("Error creating detailed report:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Bulk upload detailed reports with absent student marking
exports.bulkUploadDetailedReports = async (req, res) => {
  try {
    const { reports, markAbsentStudents = false } = req.body;

    // Validate input
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Reports must be a non-empty array",
      });
    }

    // Validate each report
    const requiredFields = [
      "regNumber",
      "studentName",
      "campus",
      "section",
      "stream",
      "testName",
      "date",
      "subjects",
      "overallTotalMarks",
      "fullMarks",
      "percentage",
      "percentile",
      "rank",
      "isPresent",
    ];

    const subjectFields = ["subjectName", "scored", "totalMarks"];

    const validationErrors = [];
    const validReports = [];

    // Get test details from first report
    const testDetails = reports[0];
    const testName = testDetails.testName;
    const stream = testDetails.stream;
    const testDate = new Date(testDetails.date);

    // Validate each report structure
    reports.forEach((report, index) => {
      const errors = [];

      // Check required fields
      requiredFields.forEach((field) => {
        if (!report[field] && report[field] !== 0 && field !== "isPresent") {
          errors.push(`Missing required field: ${field}`);
        }
      });

      // Validate stream
      if (report.stream && !["LongTerm", "PUC"].includes(report.stream)) {
        errors.push(
          `Invalid stream value: ${report.stream}. Must be 'LongTerm' or 'PUC'`
        );
      }

      // Validate subjects
      if (!Array.isArray(report.subjects) || report.subjects.length === 0) {
        errors.push("Subjects must be a non-empty array");
      } else {
        report.subjects.forEach((subject, subIndex) => {
          subjectFields.forEach((field) => {
            if (!subject[field] && subject[field] !== 0) {
              errors.push(`Subject ${subIndex + 1} missing field: ${field}`);
            }
          });
        });
      }

      // Validate date format
      if (report.date && isNaN(new Date(report.date).getTime())) {
        errors.push("Invalid date format");
      }

      if (errors.length > 0) {
        validationErrors.push({
          index,
          regNumber: report.regNumber || "Unknown",
          errors,
        });
      } else {
        validReports.push({
          ...report,
          date: new Date(report.date),
          isPresent: report.isPresent !== false, // Default to true if not specified
        });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed for some reports",
        errorCount: validationErrors.length,
        errors: validationErrors,
        validCount: validReports.length,
      });
    }

    // Check for existing reports to prevent duplicates
    const existingReports = await DetailedReport.find({
      $or: validReports.map((report) => ({
        regNumber: report.regNumber,
        testName: report.testName,
        stream: report.stream,
      })),
    });

    const existingReportMap = {};
    existingReports.forEach((report) => {
      const key = `${report.regNumber}-${report.testName}-${report.stream}`;
      existingReportMap[key] = true;
    });

    const reportsToInsert = [];
    const duplicateReports = [];

    validReports.forEach((report) => {
      const key = `${report.regNumber}-${report.testName}-${report.stream}`;
      if (existingReportMap[key]) {
        duplicateReports.push({
          regNumber: report.regNumber,
          testName: report.testName,
          stream: report.stream,
        });
      } else {
        reportsToInsert.push(report);
      }
    });

    // Insert new reports
    let insertedCount = 0;
    if (reportsToInsert.length > 0) {
      const result = await DetailedReport.insertMany(reportsToInsert, {
        ordered: false,
      });
      insertedCount = result.length;
    }

    // Mark absent students if requested
    let absentMarkedCount = 0;
    if (markAbsentStudents && reportsToInsert.length > 0) {
      // Get all students in the stream
      const allStudents = await Student.find({ stream });

      // Get present student regNumbers
      const presentRegNumbers = reportsToInsert.map((r) => r.regNumber);

      // Find absent students (in student collection but not in reports)
      const absentStudents = allStudents
        .filter((student) => !presentRegNumbers.includes(student.regNumber))
        .map((student) => ({
          regNumber: student.regNumber,
          studentName: student.studentName,
          campus: student.campus,
          section: student.section,
          stream: student.stream,
          testName,
          date: testDate,
          subjects: [], // Empty subjects for absent students
          overallTotalMarks: 0,
          fullMarks: 0,
          percentage: 0,
          percentile: 0,
          rank: 0,
          isPresent: false,
        }));

      if (absentStudents.length > 0) {
        const absentResult = await DetailedReport.insertMany(absentStudents, {
          ordered: false,
        });
        absentMarkedCount = absentResult.length;
      }
    }

    // Update student information if needed
    const uniqueStudents = [
      ...new Set(reportsToInsert.map((r) => r.regNumber)),
    ];
    await Student.updateMany(
      { regNumber: { $in: uniqueStudents } },
      { $set: { hasReports: true } }
    );

    res.status(201).json({
      status: "success",
      message: "Bulk upload completed",
      totalReceived: reports.length,
      insertedCount,
      duplicateCount: duplicateReports.length,
      absentMarkedCount,
      validationErrorCount: validationErrors.length,
      duplicates: duplicateReports,
      validationErrors,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);

    // Handle specific MongoDB errors
    if (err.name === "MongoBulkWriteError") {
      const insertedCount = err.result?.insertedCount || 0;
      const writeErrors = err.writeErrors || [];

      return res.status(400).json({
        status: "partial",
        message: "Some reports failed to upload",
        insertedCount,
        errorCount: writeErrors.length,
        errors: writeErrors.map((e) => ({
          index: e.index,
          regNumber: reports[e.index]?.regNumber || "Unknown",
          error: e.errmsg,
        })),
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get reports with comprehensive filtering
exports.getDetailedReports = async (req, res) => {
  try {
    const {
      regNumber,
      testName,
      stream,
      campus,
      section,
      dateFrom,
      dateTo,
      isPresent,
    } = req.query;

    const filter = {};

    if (regNumber) filter.regNumber = regNumber;
    if (testName) filter.testName = testName;
    if (stream) filter.stream = stream;
    if (campus) filter.campus = campus;
    if (section) filter.section = section;
    if (isPresent !== undefined) filter.isPresent = isPresent === "true";

    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const reports = await DetailedReport.find(filter).sort({
      date: -1,
      testName: 1,
    });

    res.status(200).json({
      status: "success",
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get student's reports with test-wise grouping
exports.getDetailedReportsByStudentId = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const { stream } = req.query;

    if (!regNumber) {
      return res.status(400).json({
        status: "error",
        message: "Registration number is required",
      });
    }

    // Build query
    const query = { regNumber };
    if (stream) query.stream = stream;

    // Get reports grouped by testName
    const reports = await DetailedReport.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$testName",
          reports: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          testName: "$_id",
          reports: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No reports found for this student",
      });
    }

    res.status(200).json({
      status: "success",
      data: reports,
    });
  } catch (err) {
    console.error("Error fetching student reports:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Get single report by ID
exports.getDetailedReportById = async (req, res) => {
  try {
    const report = await DetailedReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Report not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

//for downloading detailedreports campus wise
exports.loadDetailedReportsByCampus = async (req, res) => {
  try {
    const { campus } = req.query;

    if (!campus) {
      return res.status(400).json({
        status: "error",
        message: "Campus name is required as a query parameter.",
      });
    }

    // Fetch all students with the given campus name (string comparison)
    const students = await Student.find({}).populate('campus');
    const matchingStudents = students.filter(s => s.campus?.name === campus);

    const regNumbers = matchingStudents.map(s => s.regNumber);

    if (regNumbers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No students found for this campus.",
      });
    }

    // Fetch all reports for these students
    const reports = await DetailedReport.find({ regNumber: { $in: regNumbers } }).sort({ date: -1 });

    res.status(200).json({
      status: "success",
      totalStudents: regNumbers.length,
      totalReports: reports.length,
      data: reports,
    });
  } catch (err) {
    console.error("Error loading detailed reports:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update report
exports.updateDetailedReport = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.body.date) updates.date = new Date(req.body.date);

    const report = await DetailedReport.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Report not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Delete report
exports.deleteDetailedReport = async (req, res) => {
  try {
    const report = await DetailedReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Report not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Report deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get test-wise performance for a student
exports.getStudentTestPerformance = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const { stream } = req.query;

    if (!regNumber) {
      return res.status(400).json({
        status: "error",
        message: "Registration number is required",
      });
    }

    const query = { regNumber };
    if (stream) query.stream = stream;

    const performance = await DetailedReport.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$testName",
          latestReport: { $first: "$$ROOT" },
          attempts: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" },
          highestPercentage: { $max: "$percentage" },
        },
      },
      {
        $project: {
          testName: "$_id",
          latestReport: 1,
          attempts: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          highestPercentage: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: performance,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Mark absent students for a test
exports.markAbsentStudents = async (req, res) => {
  try {
    const { testName, stream } = req.body;

    if (!testName || !stream) {
      return res.status(400).json({
        status: "error",
        message: "Test name and stream are required",
      });
    }

    // Get the test details to get the date
    const test = await DetailedReport.findOne({
      testName,
      stream,
      isPresent: true,
    });
    if (!test) {
      return res.status(404).json({
        status: "error",
        message: "Test not found",
      });
    }

    // Get all students in the stream
    const allStudents = await Student.find({ stream });

    // Get present student regNumbers for this test
    const presentStudents = await DetailedReport.find({
      testName,
      stream,
      isPresent: true,
    });
    const presentRegNumbers = presentStudents.map((r) => r.regNumber);

    // Find absent students (in student collection but not in reports)
    const absentStudents = allStudents.filter(
      (student) => !presentRegNumbers.includes(student.regNumber)
    );

    // Prepare absent records
    const absentRecords = absentStudents.map((student) => ({
      regNumber: student.regNumber,
      studentName: student.studentName,
      campus: student.campus,
      section: student.section,
      stream: student.stream,
      testName,
      date: test.date,
      subjects: [], // Empty subjects for absent students
      overallTotalMarks: 0,
      fullMarks: 0,
      percentage: 0,
      percentile: 0,
      rank: 0,
      isPresent: false,
      remarks: "Absent for the test",
    }));

    // Insert absent records
    let insertedCount = 0;
    if (absentRecords.length > 0) {
      // First check if they're already marked absent
      const existingAbsent = await DetailedReport.find({
        regNumber: { $in: absentRecords.map((r) => r.regNumber) },
        testName,
        stream,
      });

      const existingRegNumbers = existingAbsent.map((r) => r.regNumber);
      const newAbsentRecords = absentRecords.filter(
        (r) => !existingRegNumbers.includes(r.regNumber)
      );

      if (newAbsentRecords.length > 0) {
        const result = await DetailedReport.insertMany(newAbsentRecords);
        insertedCount = result.length;
      }
    }

    res.status(200).json({
      status: "success",
      message: "Absent students marked",
      totalStudents: allStudents.length,
      presentStudents: presentRegNumbers.length,
      absentStudents: absentStudents.length,
      newAbsentMarked: insertedCount,
      alreadyMarked: absentStudents.length - insertedCount,
    });
  } catch (err) {
    console.error("Error marking absent students:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
