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
// Get unique test names
exports.getSolutionTestNames = async function (req, res) {
  try {
    const { stream } = req.query;

    const filter = {};

    if (stream) {
      filter.stream = stream;
    }

    const testNames = await Solution.distinct("testName", filter);

    testNames.sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    return res.status(200).json({
      status: "success",
      data: testNames,
    });
  } catch (err) {
    console.error("Error in getSolutionTestNames:", err);

    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.getSolutionBank = async function (req, res) {
  try {
    const {
      stream,
      questionType,
      testName,
      date,
      page = 1,
      limit = 50,
    } = req.query;

    // ---------------------------------------
    // 1. Build Solution filter
    // ---------------------------------------
    const filter = {};

    if (stream) {
      filter.stream = stream;
    }

    if (questionType) {
      filter.questionType = questionType;
    }

    if (testName) {
      filter.testName = testName;
    }

    // ---------------------------------------
    // 2. Date filter
    // ---------------------------------------
    if (date) {
      const selectedDate = new Date(date);

      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date format",
        });
      }

      // Match the complete calendar day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // ---------------------------------------
    // 3. Find the MOST RECENT Solution
    //    among the matching filters
    // ---------------------------------------
    const latestSolution = await Solution.findOne(filter).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    if (!latestSolution) {
      return res.status(404).json({
        status: "error",
        message: "No solutions found with the provided filters",
      });
    }

    // ---------------------------------------
    // 4. Pagination
    // ---------------------------------------
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const pageLimit = Math.max(parseInt(limit) || 50, 1);

    const skip = (currentPage - 1) * pageLimit;

    // ---------------------------------------
    // 5. Count SolutionBank entries
    //    belonging ONLY to latest Solution
    // ---------------------------------------
    const total = await SolutionBank.countDocuments({
      solutionRef: latestSolution._id,
    });

    // ---------------------------------------
    // 6. Get SolutionBank for latest Solution
    // ---------------------------------------
    const solutionBankEntries = await SolutionBank.find({
      solutionRef: latestSolution._id,
    })
      .populate("solutionRef")
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
      )
      .sort({ questionNumber: 1 })
      .skip(skip)
      .limit(pageLimit);

    // ---------------------------------------
    // 7. Pagination information
    // ---------------------------------------
    const totalPages = Math.ceil(total / pageLimit);

    return res.status(200).json({
      status: "success",

      // Information about which Solution was selected
      solutionId: latestSolution._id,
      testName: latestSolution.testName,
      stream: latestSolution.stream,
      questionType: latestSolution.questionType,
      date: latestSolution.date,

      // Pagination
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,

      data: solutionBankEntries,
    });
  } catch (err) {
    console.error("Error in getSolutionBank:", err);

    return res.status(500).json({
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
// Controller for bulk updates
exports.updateSolutionsInBulk = async function (req, res) {
  try {
    const { solutionIds, solutionBank, studentReports } = req.body;

    // Validate solutionIds
    if (!Array.isArray(solutionIds) || solutionIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one valid solution ID is required",
      });
    }

    // Validate every solution ID
    const invalidIds = solutionIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "One or more solution IDs are invalid",
        invalidIds,
      });
    }

    // Validate solutionBank
    if (!Array.isArray(solutionBank) || solutionBank.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Solutions data must be an array",
      });
    }

    /*
     * Prepare bulk operations.
     *
     * Each question update is applied to ALL SolutionBank
     * documents belonging to the supplied solution IDs.
     */
    const updateOperations = solutionBank.map((entry) => ({
      updateMany: {
        filter: {
          solutionRef: {
            $in: solutionIds,
          },
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

    // Execute bulk update
    const solutionResult = await SolutionBank.bulkWrite(updateOperations);

    // Update student reports if provided
    let reportResult = {};

    if (studentReports && Array.isArray(studentReports)) {
      const reportUpdates = studentReports.map((report) => ({
        updateOne: {
          filter: {
            _id: report._id,
          },
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

    return res.status(200).json({
      status: "success",

      matchedSolutions: solutionResult.matchedCount || 0,

      modifiedSolutions: solutionResult.modifiedCount || 0,

      modifiedReports: reportResult.modifiedCount || 0,

      message: `Updated ${
        solutionResult.modifiedCount || 0
      } SolutionBank entries and ${reportResult.modifiedCount || 0} reports`,
    });
  } catch (err) {
    console.error("Bulk update error:", err);

    return res.status(400).json({
      status: "error",
      message: err.message || "Failed to update solutions",
    });
  }
};

// Create Duplicate Solution from Existing Test
exports.createDuplicateSolution = async function (req, res) {
  try {
    const { sourceSolutionId, stream, questionType, testName, date } = req.body;

    // Validate required fields
    if (!sourceSolutionId || !stream || !questionType || !testName || !date) {
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
