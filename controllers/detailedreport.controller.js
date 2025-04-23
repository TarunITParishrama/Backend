const DetailedReport = require("../models/DetailedReports");
const Student = require("../models/Students");

// Create DetailedReport (frontend sends pre-calculated data)
exports.createDetailedReport = async (req, res) => {
  try {
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
      "accuracy",
      "percentage",
      "percentile"
    ];

    // Updated validation that properly handles zero values
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Additional validation for subjects array
    if (!Array.isArray(req.body.subjects)) {
      return res.status(400).json({
        status: "error",
        message: "Subjects must be an array"
      });
    }

    const invalidSubjects = req.body.subjects.filter(subject => {
      return !subject.subjectName || 
             typeof subject.totalMarks === 'undefined' || 
             typeof subject.correctAnswers === 'undefined';
    });

    if (invalidSubjects.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Some subjects are missing required fields"
      });
    }

    // Create report
    const detailedReport = await DetailedReport.create(req.body);

    res.status(201).json({
      status: "success",
      data: detailedReport
    });
  } catch (err) {
    console.error("Error creating detailed report:", err);
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};

// Get all DetailedReports with filters
exports.getDetailedReports = async (req, res) => {
  try {
    const {
      regNumber,
      testName,
      stream,
      date,
      minPercentage,
      maxPercentage,
      minPercentile,
      maxPercentile
    } = req.query;

    const filter = {};

    // Apply basic filters
    if (regNumber) filter.regNumber = regNumber;
    if (testName) filter.testName = testName;
    if (stream) filter.stream = stream;
    if (date) filter.date = new Date(date);

    // Percentage range filter
    if (minPercentage || maxPercentage) {
      filter.percentage = {};
      if (minPercentage) filter.percentage.$gte = Number(minPercentage);
      if (maxPercentage) filter.percentage.$lte = Number(maxPercentage);
    }

    // Percentile range filter
    if (minPercentile || maxPercentile) {
      filter.percentile = {};
      if (minPercentile) filter.percentile.$gte = Number(minPercentile);
      if (maxPercentile) filter.percentile.$lte = Number(maxPercentile);
    }

    // Get reports
    const reports = await DetailedReport.find(filter).sort({ date: -1 });

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

// Get DetailedReports by RegNumber
exports.getDetailedReportsByStudentId = async (req, res) => {
  try {
    const { regNumber } = req.params;

    if (!regNumber) {
      return res.status(400).json({
        status: "error",
        message: "Registration number is required"
      });
    }

    // Verify student exists
    const student = await Student.findOne({ regNumber });
    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found"
      });
    }

    const reports = await DetailedReport.find({ regNumber })
      .select(
        "testName date subjects overallTotalMarks accuracy percentage percentile"
      )
      .sort({ date: -1 });

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No detailed reports found for this student"
      });
    }

    res.status(200).json({
      status: "success",
      data: reports
    });
  } catch (err) {
    console.error("Error fetching detailed reports:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

// Get single DetailedReport by ID
exports.getDetailedReportById = async (req, res) => {
  try {
    const report = await DetailedReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Detailed report not found"
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

// Update DetailedReport
exports.updateDetailedReport = async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined
    };

    const updatedReport = await DetailedReport.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({
        status: "error",
        message: "Detailed report not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: updatedReport
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};

// Delete DetailedReport
exports.deleteDetailedReport = async (req, res) => {
  try {
    const deletedReport = await DetailedReport.findByIdAndDelete(req.params.id);

    if (!deletedReport) {
      return res.status(404).json({
        status: "error",
        message: "Detailed report not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "Detailed report deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};