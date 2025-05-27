const StudentReport = require("../models/StudentReport");
const Subject = require("../models/Subjects");
const Chapter = require("../models/Chapters");
const Subtopic = require("../models/Subtopic");
const mongoose = require("mongoose");

// Create StudentReport (frontend sends pre-calculated values)
exports.createOrUpdateStudentReport = async (req, res) => {
  try {
    const requiredFields = [
      'regNumber', 'stream', 'testName', 'date',
      'marksType', 'totalQuestions', 'correctAnswers', 'wrongAnswers',
      'unattempted', 'accuracy', 'percentage', 'totalMarks', 'percentile', 'responses'
    ];

    // Validate required fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Normalize date format
    const reportDate = new Date(req.body.date);
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid date format"
      });
    }

    // Create unique query
    const query = {
      regNumber: req.body.regNumber,
      stream: req.body.stream,
      testName: req.body.testName,
      date: {
        $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
        $lt: new Date(reportDate.setHours(23, 59, 59, 999))
      }
    };

    // Prepare update data
    const updateData = {
      ...req.body,
      date: reportDate,
      updatedAt: new Date() // Track when this was last modified
    };

    // Options for findOneAndUpdate
    const options = {
      new: true,         // Return the updated document
      upsert: true,      // Create if doesn't exist
      runValidators: true // Run schema validations
    };

    // Perform the upsert operation
    const studentReport = await StudentReport.findOneAndUpdate(
      query,
      updateData,
      options
    );

    // Determine if this was an update or create
    const operationType = studentReport.createdAt === studentReport.updatedAt ? 
      "created" : "updated";

    res.status(200).json({
      status: "success",
      data: studentReport,
      message: `Report ${operationType} successfully`
    });

  } catch (err) {
    console.error("Error in createOrUpdateStudentReport:", err);
    
    // Handle duplicate key errors specifically
    if (err.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Duplicate report detected. This report already exists."
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message || "Internal server error"
    });
  }
};

exports.checkExistingReports = async (req, res) => {
  try {
    const reports = req.body.reports;
    if (!Array.isArray(reports)) {
      return res.status(400).json({
        status: "error",
        message: "Reports must be provided as an array"
      });
    }

    const existingCount = await StudentReport.countDocuments({
      $or: reports.map(report => {
        const reportDate = new Date(report.date);
        return {
          regNumber: report.regNumber,
          testName: report.testName,
          stream: report.stream,
          date: {
            $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
            $lt: new Date(reportDate.setHours(23, 59, 59, 999))
          }
        };
      })
    });

    res.status(200).json({
      status: "success",
      data: {
        existingCount,
        totalCount: reports.length
      }
    });

  } catch (err) {
    console.error("Error checking existing reports:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to check existing reports"
    });
  }
};

exports.bulkCreateOrUpdateStudentReports = async (req, res) => {
  try {
    const reports = req.body.reports;
    if (!Array.isArray(reports)) {
      return res.status(400).json({
        status: "error",
        message: "Reports must be provided as an array"
      });
    }

    // Check for existing reports first
    const existingReports = await StudentReport.find({
      $or: reports.map(report => {
        const reportDate = new Date(report.date);
        return {
          regNumber: report.regNumber,
          testName: report.testName,
          stream: report.stream,
          date: {
            $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
            $lt: new Date(reportDate.setHours(23, 59, 59, 999))
          }
        };
      })
    });

    const existingReportMap = new Map();
    existingReports.forEach(report => {
      const key = `${report.regNumber}-${report.testName}-${report.stream}-${report.date.toISOString().split('T')[0]}`;
      existingReportMap.set(key, report._id);
    });

    const operations = [];
    const toCreate = [];
    const toUpdate = [];

    reports.forEach(report => {
      const reportDate = new Date(report.date);
      const key = `${report.regNumber}-${report.testName}-${report.stream}-${reportDate.toISOString().split('T')[0]}`;
      
      if (existingReportMap.has(key)) {
        toUpdate.push({
          updateOne: {
            filter: { _id: existingReportMap.get(key) },
            update: {
              $set: {
                ...report,
                date: reportDate,
                updatedAt: new Date()
              }
            }
          }
        });
      } else {
        toCreate.push({
          insertOne: {
            document: {
              ...report,
              date: reportDate
            }
          }
        });
      }
    });

    // Execute updates first
    if (toUpdate.length > 0) {
      await StudentReport.bulkWrite(toUpdate);
    }

    // Then create new records
    if (toCreate.length > 0) {
      await StudentReport.bulkWrite(toCreate);
    }

    res.status(200).json({
      status: "success",
      data: {
        created: toCreate.length,
        updated: toUpdate.length,
        total: reports.length
      },
      message: `Processed ${reports.length} reports (${toCreate.length} created, ${toUpdate.length} updated)`
    });

  } catch (err) {
    console.error("Bulk operation error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to process reports"
    });
  }
};

// Get all StudentReports with filters (simplified)
exports.getStudentReports = async (req, res) => {
    try {
        const { regNumber, testName, date, minAccuracy, maxAccuracy } = req.query;
        const filter = {};

        // Apply basic filters
        if (regNumber) filter.regNumber = regNumber;
        if (testName) filter.testName = testName;
        if (date) filter.date = new Date(date);

        // Accuracy range filter
        if (minAccuracy || maxAccuracy) {
            filter.accuracy = {};
            if (minAccuracy) filter.accuracy.$gte = Number(minAccuracy);
            if (maxAccuracy) filter.accuracy.$lte = Number(maxAccuracy);
        }

//         const page = parseInt(req.query.page) || 1;
// const limit = parseInt(req.query.limit) || 100;
// const skip = (page - 1) * limit;

// const total = await StudentReport.countDocuments(filter);

const reports = await StudentReport.find(filter)
    .sort({ date: -1 })
    // .skip(skip)
    // .limit(limit);

res.status(200).json({
    status: "success",
    // total,
    // page,
    // totalPages: Math.ceil(total / limit),
    data: reports
});


    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};

//Get all StudentReports with RegNumber
exports.getStudentReportByStudentId = async (req, res) => {
    try {
      const { regNumber } = req.params;
  
      if (!regNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration number is required'
        });
      }
  
      const reports = await StudentReport.find({ regNumber })
        .select('testName date correctAnswers wrongAnswers unattempted totalMarks percentile accuracy')
        .sort({ date: -1 }) 
        .lean();
  
      if (!reports || reports.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No reports found for this student'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: reports
      });
  
    } catch (err) {
      console.error('Error fetching student reports:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
};

// Get single report by ID
exports.getStudentReportById = async (req, res) => {
    try {
        const report = await StudentReport.findById(req.params.id)
            .populate('subject', 'subjectName')
            .populate('chapter', 'chapterName')
            .populate('subtopic', 'subtopicName');

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

// Update report (frontend sends updated calculations)
exports.updateStudentReport = async (req, res) => {
    try {
        const updatedData = {
            ...req.body,
            date: req.body.date ? new Date(req.body.date) : undefined
        };

        const updatedReport = await StudentReport.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true }
        ).populate('subject', 'subjectName')
         .populate('chapter', 'chapterName')
         .populate('subtopic', 'subtopicName');

        if (!updatedReport) {
            return res.status(404).json({
                status: "error",
                message: "Report not found"
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

// Delete report
exports.deleteStudentReport = async (req, res) => {
    try {
        const deletedReport = await StudentReport.findByIdAndDelete(req.params.id);

        if (!deletedReport) {
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