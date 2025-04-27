const DetailedReport = require("../models/DetailedReports");
//const Student = require("../models/Students");

// Create DetailedReport with stream validation
exports.createDetailedReport = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      "regNumber", "studentName", "campus", "section", "stream", 
      "testName", "date", "subjects", "overallTotalMarks", "fullMarks",
      "accuracy", "percentage", "percentile", "rank"
    ];

    const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Validate stream
    if (!["LongTerm", "PUC"].includes(req.body.stream)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid stream value. Must be either 'LongTerm' or 'PUC'"
      });
    }

    // Validate subjects
    if (!Array.isArray(req.body.subjects) || req.body.subjects.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Subjects must be a non-empty array"
      });
    }

    // Create the report
    const report = new DetailedReport({
      ...req.body,
      date: new Date(req.body.date)
    });

    await report.save();

    res.status(201).json({
      status: "success",
      data: report
    });
  } catch (err) {
    console.error("Error creating detailed report:", err);
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};

// Get reports with comprehensive filtering
exports.getDetailedReports = async (req, res) => {
  try {
    const { regNumber, testName, stream, campus, section, dateFrom, dateTo } = req.query;

    const filter = {};

    if (regNumber) filter.regNumber = regNumber;
    if (testName) filter.testName = testName;
    if (stream) filter.stream = stream;
    if (campus) filter.campus = campus;
    if (section) filter.section = section;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const reports = await DetailedReport.find(filter)
      .sort({ date: -1, testName: 1 });

    res.status(200).json({
      status: "success",
      count: reports.length,
      data: reports
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
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
        message: "Registration number is required"
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
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          testName: "$_id",
          reports: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No reports found for this student"
      });
    }

    res.status(200).json({
      status: "success",
      data: reports
    });
  } catch (err) {
    console.error("Error fetching student reports:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
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
        message: "Report not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: report
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
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
        message: "Report not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: report
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
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
        message: "Report not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "Report deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
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
        message: "Registration number is required"
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
          highestPercentage: { $max: "$percentage" }
        }
      },
      {
        $project: {
          testName: "$_id",
          latestReport: 1,
          attempts: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] },
          highestPercentage: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      status: "success",
      data: performance
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};