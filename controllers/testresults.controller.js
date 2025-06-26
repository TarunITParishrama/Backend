const TestResults = require("../models/TestResults");
const Pattern = require("../models/Patterns");
const mongoose = require("mongoose");
const Student = require("../models/Students.js");

// Check existing test results
exports.checkExistingResults = async (req, res) => {
  try {
    const { results } = req.body;

    if (!Array.isArray(results)) {
      return res.status(400).json({
        status: "error",
        message: "Results must be provided as an array",
      });
    }

    const existingCount = await TestResults.countDocuments({
      $or: results.map((result) => ({
        regNumber: result.regNumber,
        testName: result.testName,
        date: {
          $gte: new Date(new Date(result.date).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(result.date).setHours(23, 59, 59, 999)),
        },
      })),
    });

    res.status(200).json({
      status: "success",
      data: {
        existingCount,
        totalCount: results.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Create or update test results
exports.createTestResults = async (req, res) => {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No results provided",
      });
    }

    // In createTestResults controller
    const bulkOps = results.map((result) => ({
      updateOne: {
        filter: {
          regNumber: result.regNumber,
          testName: result.testName,
          date: {
            $gte: new Date(new Date(result.date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(result.date).setHours(23, 59, 59, 999)),
          },
        },
        update: {
          $set: {
            ...result,
            isPresent: result.isPresent !== undefined ? result.isPresent : true,
          },
        },
        upsert: true,
      },
    }));

    const response = await TestResults.bulkWrite(bulkOps);

    res.status(200).json({
      status: "success",
      data: {
        created: response.upsertedCount,
        updated: response.modifiedCount,
        total: results.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get results by registration number
exports.getResultsByRegNumber = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const { includePresence } = req.query;

    let projection = {};
    if (includePresence === "true") {
      projection.isPresent = 1;
    }

    const results = await TestResults.find({ regNumber }, projection)
      .sort({ date: -1 })
      .limit(100);

    res.status(200).json({
      status: "success",
      data: results,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update presence status for test results
exports.updatePresenceStatus = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        status: "error",
        message: "Updates must be provided as an array",
      });
    }

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: {
          regNumber: update.regNumber,
          testName: update.testName,
          date: {
            $gte: new Date(new Date(update.date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(update.date).setHours(23, 59, 59, 999)),
          },
        },
        update: { $set: { isPresent: update.isPresent } },
      },
    }));

    const response = await TestResults.bulkWrite(bulkOps);

    res.status(200).json({
      status: "success",
      data: {
        matched: response.matchedCount,
        modified: response.modifiedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get results by test name and date range
exports.getResultsByTest = async (req, res) => {
  try {
    const { testName } = req.params;
    const { stream } = req.query;

    // Normalize test name by removing all spaces
    const normalizedTestName = testName.replace(/\s+/g, "");

    const results = await TestResults.find({
      stream,
      $expr: {
        $eq: [
          { $replaceAll: { input: "$testName", find: " ", replacement: "" } },
          normalizedTestName,
        ],
      },
    }).sort({ date: -1, totalMarks: -1 });

    res.status(200).json({
      status: "success",
      data: results,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAbsentStudents = async (req, res) => {
  try {
    const { testName, date, stream } = req.query;

    // Get all students in the stream
    const students = await Student.find({ stream }).lean();

    // Get present students for this test
    const presentStudents = await TestResults.find({
      testName,
      date: new Date(date),
      stream,
      isPresent: true,
    }).distinct("regNumber");

    // Find absent students
    const absentStudents = students
      .filter((student) => !presentStudents.includes(student.regNumber))
      .map((student) => ({
        regNumber: student.regNumber,
        studentName: student.studentName,
        campus: student.campus,
        section: student.section,
        isPresent: false,
      }));

    res.status(200).json({
      status: "success",
      data: absentStudents,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAllTestNames = async (req, res) => {
  try {
    const { stream } = req.query;

    const testNames = await TestResults.distinct("testName", { stream });

    res.status(200).json({
      status: "success",
      data: testNames,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
