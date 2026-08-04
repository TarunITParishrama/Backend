const express = require("express");
const Solution = require("../models/Solution");
const SolutionBank = require("../models/SolutionBank");
const StudentReport = require("../models/StudentReport");
const mongoose = require("mongoose");

// Create Solution and SolutionBank entries
exports.createSolution = async function (req, res) {
  try {
    const { stream, questionType, testName, date, solutionBank } = req.body;

    if (!stream || !questionType || !testName || !date || !solutionBank) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    const solution = await Solution.create({
      stream,
      questionType,
      testName,
      date: new Date(date),
    });

    const solutionBankEntries = await Promise.all(
      solutionBank.map(async (entry) => {
        if (
          entry.questionNumber === undefined ||
          typeof entry.questionNumber !== "number"
        ) {
          throw new Error("Question number is required and must be a number");
        }

        if (questionType === "MCQ") {
          if (!Array.isArray(entry.correctOptions)) {
            throw new Error(
              "correctOptions array is required for MCQ questions",
            );
          }

          if (entry.correctOptions.length === 0) {
            throw new Error(
              "At least one correct option must be specified for MCQ questions",
            );
          }
        }

        return await SolutionBank.create({
          solutionRef: solution._id,
          date: solution.date,

          questionNumber: entry.questionNumber,

          // NEW
          questionText: entry.questionText || "",

          // NEW
          questionImages: entry.questionImages || [],

          correctOptions: entry.correctOptions || [],
          correctSolution: entry.correctSolution || "",
          isGrace: entry.isGrace || false,
        });
      }),
    );

    res.status(201).json({
      status: "success",
      data: {
        solution,
        solutionBank: solutionBankEntries,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get SolutionBank entries with filters
exports.getSolutionBank = async function (req, res) {
  try {
    const { stream, questionType, testName, date } = req.query;
    const filter = {};

    // Add filters
    if (stream) filter.stream = stream;
    if (questionType) filter.questionType = questionType;
    if (testName) filter.testName = testName;
    if (date) filter.date = new Date(date);

    const solutions = await Solution.find(filter);
    if (solutions.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No solutions found with these filters",
      });
    }
    const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 100;
    // const skip = (page - 1) * limit;
    const total = await SolutionBank.countDocuments({
      solutionRef: { $in: solutions.map((s) => s._id) },
    });
    const filteredSolutionIds = solutions.map((s) => s._id);

    const solutionBankEntries = await SolutionBank.find({
      solutionRef: { $in: filteredSolutionIds },
    })
      .populate("solutionRef")
      // .skip(skip)
      // .limit(limit)
      .select(
        `
solutionRef
questionNumber
questionText
questionImages
correctOptions
correctSolution
isGrace
date
`,
      );
    res.status(200).json({
      status: "success",
      total,
      // page,
      // totalPages: Math.ceil(total/limit),
      data: solutionBankEntries.sort(
        (a, b) => a.questionNumber - b.questionNumber,
      ),
    });
  } catch (err) {
    console.error("Error in getSolutionBank:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update Solution
// Update Solution (and sync SolutionBank date)
exports.updateSolutionById = async function (req, res) {
  try {
    const { questionType, testName, date, stream } = req.body;

    // Find existing solution
    const existingSolution = await Solution.findById(req.params.solutionId);

    if (!existingSolution) {
      return res.status(404).json({
        status: "error",
        message: "Solution not found",
      });
    }

    // Prepare update object
    const updateData = {};

    if (questionType) updateData.questionType = questionType;
    if (testName) updateData.testName = testName;
    if (stream) updateData.stream = stream;

    if (date) {
      updateData.date = new Date(date);
    }

    // Update Solution document
    const updatedSolution = await Solution.findByIdAndUpdate(
      req.params.solutionId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // Keep SolutionBank date synchronized
    if (date) {
      await SolutionBank.updateMany(
        {
          solutionRef: req.params.solutionId,
        },
        {
          $set: {
            date: new Date(date),
          },
        },
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Test information updated successfully",
      data: updatedSolution,
    });
  } catch (err) {
    console.error("Update Solution Error:", err);

    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Delete SolutionBank entry
exports.deleteSolutionById = async function (req, res) {
  try {
    const solution = await Solution.findById(req.params.solutionId);

    if (!solution) {
      return res.status(404).json({
        status: "error",
        message: "Solution not found",
      });
    }

    const deletedQuestions = await SolutionBank.countDocuments({
      solutionRef: solution._id,
    });

    await SolutionBank.deleteMany({
      solutionRef: solution._id,
    });

    await Solution.findByIdAndDelete(solution._id);

    return res.status(200).json({
      status: "success",
      message: `${solution.testName} deleted successfully`,
      deletedQuestions,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update SolutionBank entry
exports.updateSolutionBankById = async function (req, res) {
  try {
    const {
      questionNumber,
      questionText,
      questionImages,
      correctOptions,
      correctSolution,
    } = req.body;

    const entry = await SolutionBank.findById(req.params.entryId).populate(
      "solutionRef",
    );

    if (!entry) {
      return res.status(404).json({
        status: "error",
        message: "SolutionBank entry not found",
      });
    }

    if (entry.solutionRef.questionType === "MCQ") {
      if (!Array.isArray(correctOptions)) {
        return res.status(400).json({
          status: "error",
          message: "correctOptions array is required for MCQ questions",
        });
      }

      if (correctOptions.length === 0) {
        return res.status(400).json({
          status: "error",
          message:
            "At least one correct option must be specified for MCQ questions",
        });
      }
    }

    const updatedEntry = await SolutionBank.findByIdAndUpdate(
      req.params.entryId,
      {
        questionNumber,
        questionText,
        questionImages,
        correctOptions: correctOptions || [],
        correctSolution,
      },
      {
        new: true,
      },
    ).populate("solutionRef");

    res.status(200).json({
      status: "success",
      data: updatedEntry,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

//controller for bulk updates
exports.updateSolutionsInBulk = async function (req, res) {
  try {
    const { solutionId, solutionBank, studentReports } = req.body;

    // Validate solutionId
    if (!solutionId || !mongoose.Types.ObjectId.isValid(solutionId)) {
      return res.status(400).json({
        status: "error",
        message: "Valid test ID is required",
      });
    }

    // Validate solutionBank
    if (!solutionBank || !Array.isArray(solutionBank)) {
      return res.status(400).json({
        status: "error",
        message: "Solutions data must be an array",
      });
    }

    // Prepare bulk operations
    const updateOperations = solutionBank.map((entry) => ({
      updateOne: {
        filter: {
          solutionRef: solutionId,
          questionNumber: entry.questionNumber,
        },
        update: {
          $set: {
            questionText: entry.questionText || "",

            questionImages: entry.questionImages || [],

            correctOptions: entry.correctOptions || [],

            correctSolution: entry.correctSolution || "",

            isGrace: entry.isGrace || false,
          },
        },
      },
    }));

    // Execute bulk write
    const solutionResult = await SolutionBank.bulkWrite(updateOperations);

    // Update student reports if provided
    let reportResult = {};
    if (studentReports && Array.isArray(studentReports)) {
      const reportUpdates = studentReports.map((report) => ({
        updateOne: {
          filter: { _id: report._id },
          update: {
            $set: {
              correctAnswers: report.correctAnswers,
              wrongAnswers: report.wrongAnswers,
              unattempted: report.unattempted,
              totalMarks: report.totalMarks,
              accuracy: report.accuracy,
              percentage: report.percentage,
              percentile: report.percentile,
              rank: report.rank,
              responses: report.responses,
            },
          },
        },
      }));

      reportResult = await StudentReport.bulkWrite(reportUpdates);
    }

    res.status(200).json({
      status: "success",
      modifiedSolutions: solutionResult.modifiedCount,
      modifiedReports: reportResult.modifiedCount || 0,
      message: `Updated ${solutionResult.modifiedCount} solutions and ${
        reportResult.modifiedCount || 0
      } reports`,
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(400).json({
      status: "error",
      message: err.message || "Failed to update solutions",
    });
  }
};

// Create Duplicate Solution from Existing Test
exports.createDuplicateSolution = async function (req, res) {
  try {
    const {
      sourceSolutionId,
      stream,
      questionType,
      testName,
      date,
    } = req.body;

    // Validate required fields
    if (
      !sourceSolutionId ||
      !stream ||
      !questionType ||
      !testName ||
      !date
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    // Check if test name already exists
    const existingTest = await Solution.findOne({
      testName: testName.trim(),
      stream,
      questionType,
    });

    if (existingTest) {
      return res.status(400).json({
        status: "error",
        message: "A test with this name already exists.",
      });
    }

    // Find source solution
    const sourceSolution = await Solution.findById(sourceSolutionId);

    if (!sourceSolution) {
      return res.status(404).json({
        status: "error",
        message: "Source solution not found.",
      });
    }

    // Fetch all questions
    const sourceQuestions = await SolutionBank.find({
      solutionRef: sourceSolution._id,
    }).sort({ questionNumber: 1 });

    // Create new Solution
    const newSolution = await Solution.create({
      stream,
      questionType,
      testName: testName.trim(),
      date: new Date(date),
    });

    // Duplicate SolutionBank
    const duplicatedQuestions = sourceQuestions.map((question) => ({
      solutionRef: newSolution._id,

      date: new Date(date),

      questionNumber: question.questionNumber,

      questionText: question.questionText || "",

      questionImages: question.questionImages || [],

      correctOptions: question.correctOptions || [],

      correctSolution: question.correctSolution || "",

      isGrace: question.isGrace || false,
    }));

    if (duplicatedQuestions.length > 0) {
      await SolutionBank.insertMany(duplicatedQuestions);
    }

    return res.status(201).json({
      status: "success",
      message: "Solution duplicated successfully.",
      data: {
        solutionId: newSolution._id,
        stream: newSolution.stream,
        questionType: newSolution.questionType,
        testName: newSolution.testName,
        date: newSolution.date,
        totalQuestions: duplicatedQuestions.length,
      },
    });
  } catch (err) {
    console.error("Create Duplicate Solution Error:", err);

    return res.status(500).json({
      status: "error",
      message: err.message || "Failed to duplicate solution.",
    });
  }
};
