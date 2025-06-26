const Report = require("../models/Report");
const ReportBank = require("../models/ReportBank");
const Solution = require("../models/Solution");

// Create Report and ReportBank entries
exports.createReport = async (req, res) => {
  try {
    const { stream, questionType, testName, date, marksType, reportBank } =
      req.body;

    // Validate required fields
    if (
      !stream ||
      !questionType ||
      !testName ||
      !date ||
      !marksType ||
      !reportBank
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // Check solution exists
    const solution = await Solution.findOne({
      testName,
      date: new Date(date),
      questionType,
      stream,
    });

    if (!solution) {
      return res.status(400).json({
        status: "error",
        message: "No solution exists for this test",
      });
    }

    // Determine total questions from the first entry
    const totalQuestions =
      reportBank.length > 0
        ? Object.keys(reportBank[0].questionAnswer).length
        : 0;

    // Create Report with totalQuestions
    const report = await Report.create({
      stream,
      questionType,
      testName,
      marksType,
      date: new Date(date),
      totalQuestions,
    });

    // Create ReportBank entries
    const reportBankEntries = await Promise.all(
      reportBank.map((entry) => {
        const questionAnswerMap = new Map();

        // Convert questionAnswer object to Map
        Object.entries(entry.questionAnswer).forEach(([qNum, answer]) => {
          questionAnswerMap.set(qNum, answer !== undefined ? answer : "");
        });

        return ReportBank.create({
          reportRef: report._id,
          date: report.date,
          regNumber: entry.regNumber,
          questionAnswer: questionAnswerMap,
        });
      })
    );

    res.status(201).json({
      status: "success",
      message: "Report created successfully",
      reportId: report._id,
      entriesCreated: reportBankEntries.length,
      totalQuestions,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message || "Failed to create report",
    });
  }
};

// Get ReportBank entries with filters
exports.getReportBank = async (req, res) => {
  try {
    const {
      reportRef,
      testName,
      stream,
      dateFrom,
      dateTo,
      regNumber,
      //   page = 1,
      //   limit = 100
    } = req.query;

    const reportFilter = {};
    const reportBankFilter = {};

    if (reportRef) reportBankFilter.reportRef = reportRef;
    if (stream) reportFilter.stream = stream;
    if (testName) reportFilter.testName = testName;
    if (regNumber) reportBankFilter.regNumber = regNumber;

    if (dateFrom && dateTo) {
      reportFilter.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    const matchedReports = await Report.find(reportFilter).select("_id");
    if (matchedReports.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No reports found matching criteria",
      });
    }

    const matchedReportIds = matchedReports.map((r) => r._id);
    reportBankFilter.reportRef = { $in: matchedReportIds };

    // const skip = (parseInt(page) - 1) * parseInt(limit);

    // const total = await ReportBank.countDocuments(reportBankFilter);

    const entries = await ReportBank.find(reportBankFilter).populate(
      "reportRef"
    );
    //   .skip(skip)
    //   .limit(parseInt(limit));

    const formattedEntries = entries.map((entry) => {
      const questionAnswers =
        entry.questionAnswer instanceof Map
          ? Object.fromEntries(entry.questionAnswer)
          : entry.questionAnswer || {};

      return {
        reportId: entry.reportRef._id,
        stream: entry.reportRef.stream,
        testName: entry.reportRef.testName,
        date: entry.reportRef.date,
        marksType: entry.reportRef.marksType,
        regNumber: entry.regNumber,
        questionAnswers,
        totalQuestions:
          entry.reportRef.totalQuestions || Object.keys(questionAnswers).length,
      };
    });

    res.status(200).json({
      status: "success",
      //   total,
      //   page: parseInt(page),
      //   totalPages: Math.ceil(total / limit),
      data: formattedEntries,
    });
  } catch (err) {
    console.error("Error in getReportBank:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch report data",
    });
  }
};

// Get ALL ReportBank entries without filters
exports.getAllReportBank = async (req, res) => {
  try {
    //         const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 100;
    // const skip = (page - 1) * limit;

    // Filtered population query
    const rawEntries = await ReportBank.find().populate("reportRef");
    // .skip(skip)
    // .limit(limit);

    // Total count (only valid entries)
    // const total = await ReportBank.countDocuments();

    // Filter entries with valid reportRef
    const filtered = rawEntries.filter((entry) => entry.reportRef);

    const formattedEntries = filtered.map((entry) => ({
      reportId: entry.reportRef._id,
      stream: entry.reportRef.stream,
      testName: entry.reportRef.testName,
      date: entry.reportRef.date,
      marksType: entry.reportRef.marksType,
      regNumber: entry.regNumber,
      questionAnswers: Object.fromEntries(entry.questionAnswer || []),
    }));

    res.status(200).json({
      status: "success",
      // total,
      // page,
      // totalPages: Math.ceil(total / limit),
      data: formattedEntries,
    });
  } catch (err) {
    console.error("Error in getAllReportBank:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch all report data",
    });
  }
};
// Get single Report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: "error",
        message: "Report not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        _id: report._id,
        stream: report.stream,
        questionType: report.questionType,
        testName: report.testName,
        marksType: report.marksType,
        date: report.date,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch report",
    });
  }
};

// Update Report
exports.updateReportById = async function (req, res) {
  try {
    const { questionType, testName, date, marksType } = req.body;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.reportId,
      {
        questionType,
        testName,
        date: date ? new Date(date) : undefined,
        marksType,
      },
      { new: true }
    );

    if (!updatedReport) {
      return res
        .status(404)
        .json({ status: "error", message: "Report not found" });
    }

    res.status(200).json({ status: "success", data: updatedReport });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Delete Report and associated ReportBank entries
exports.deleteReportById = async function (req, res) {
  try {
    // Delete ReportBank entries first
    await ReportBank.deleteMany({ reportRef: req.params.reportId });

    // Then delete the Report
    const deletedReport = await Report.findByIdAndDelete(req.params.reportId);

    if (!deletedReport) {
      return res
        .status(404)
        .json({ status: "error", message: "Report not found" });
    }

    res
      .status(200)
      .json({
        status: "success",
        message: "Report and associated entries deleted",
      });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Update ReportBank entry
exports.updateReportBankById = async function (req, res) {
  try {
    const { regNumber, questionAnswer } = req.body;

    const updatedEntry = await ReportBank.findByIdAndUpdate(
      req.params.entryId,
      {
        regNumber,
        questionAnswer: new Map(Object.entries(questionAnswer || {})),
      },
      { new: true }
    ).populate("reportRef");

    if (!updatedEntry) {
      return res
        .status(404)
        .json({ status: "error", message: "ReportBank entry not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        ...updatedEntry.toObject(),
        questionAnswer: Object.fromEntries(updatedEntry.questionAnswer),
      },
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Delete ReportBank entry
exports.deleteReportBankById = async function (req, res) {
  try {
    const deletedEntry = await ReportBank.findByIdAndDelete(req.params.entryId);

    if (!deletedEntry) {
      return res
        .status(404)
        .json({ status: "error", message: "ReportBank entry not found" });
    }

    res
      .status(200)
      .json({ status: "success", message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};
