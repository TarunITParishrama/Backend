const express = require("express");
const Solution = require("../models/Solution");
const SolutionBank = require("../models/SolutionBank");
const StudentReport = require("../models/StudentReport")
const mongoose = require('mongoose')

// Create Solution and SolutionBank entries
exports.createSolution = async function (req, res) {
    try {
        const { stream, questionType, testName, date, solutionBank } = req.body;

        // Validate required fields
        if (!stream || !questionType || !testName || !date || !solutionBank) {
            return res.status(400).json({ status: "error", message: "All fields are required" });
        }

        // Create Solution
        const solution = await Solution.create({
            stream,
            questionType,
            testName,
            date: new Date(date)
        });

        // Validate and create SolutionBank entries
        const solutionBankEntries = await Promise.all(
            solutionBank.map(async (entry) => {
                if (!entry.questionNumber || typeof entry.questionNumber !== 'number') {
                    throw new Error('Question number is required and must be a number');
                }

                // Validate based on question type
                if (questionType === "MCQ") {
                    if (!entry.correctOptions || !Array.isArray(entry.correctOptions)) {
                        throw new Error("correctOptions array is required for MCQ questions");
                    }
                    if (entry.correctOptions.length === 0) {
                        throw new Error("At least one correct option must be specified for MCQ questions");
                    }
                }

                return await SolutionBank.create({
                    solutionRef: solution._id,
                    date: solution.date,
                    questionNumber: entry.questionNumber,
                    correctOptions: entry.correctOptions || [], // Ensure this is always an array
                    correctSolution: entry.correctSolution || ""
                });
            })
        );

        res.status(201).json({
            status: "success",
            data: {
                solution,
                solutionBank: solutionBankEntries
            }
        });

    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
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
                message: "No solutions found with these filters"
            });
        }
        const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 100;
        // const skip = (page - 1) * limit;
const total = await SolutionBank.countDocuments({
  solutionRef: { $in: solutions.map(s => s._id) }
});
const filteredSolutionIds = solutions.map(s => s._id);

const solutionBankEntries = await SolutionBank.find({
  solutionRef: { $in: filteredSolutionIds }
})
        .populate('solutionRef')
        // .skip(skip)
        // .limit(limit)
        .select('solutionRef questionNumber correctOptions correctSolution isGrace date'); 
        res.status(200).json({
            status: "success",
            total,
            // page,
            // totalPages: Math.ceil(total/limit),
            data: solutionBankEntries.sort((a,b) => a.questionNumber - b.questionNumber)
        });

    } catch (err) {
        console.error("Error in getSolutionBank:", err);
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};

// Update Solution
exports.updateSolutionById = async function (req, res) {
    try {
        const { questionType, testName, date } = req.body;

        const updatedSolution = await Solution.findByIdAndUpdate(
            req.params.solutionId,
            { questionType, testName, date: date ? new Date(date) : undefined },
            { new: true }
        );

        if (!updatedSolution) {
            return res.status(404).json({ status: "error", message: "Solution not found" });
        }

        res.status(200).json({ status: "success", data: updatedSolution });

    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
    }
};

// Delete Solution and associated SolutionBank entries
exports.deleteSolutionById = async function (req, res) {
    try {
        // Delete SolutionBank entries first
        await SolutionBank.deleteMany({ solutionRef: req.params.solutionId });

        // Then delete the Solution
        const deletedSolution = await Solution.findByIdAndDelete(req.params.solutionId);

        if (!deletedSolution) {
            return res.status(404).json({ status: "error", message: "Solution not found" });
        }

        res.status(200).json({ status: "success", message: "Solution and associated entries deleted" });

    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
    }
};

// Update SolutionBank entry 
exports.updateSolutionBankById = async function (req, res) {
    try {
        const { questionNumber, correctOptions, correctSolution } = req.body;

        // Validate for MCQ type
        const entry = await SolutionBank.findById(req.params.entryId).populate('solutionRef');
        if (!entry) {
            return res.status(404).json({ status: "error", message: "SolutionBank entry not found" });
        }

        if (entry.solutionRef.questionType === "MCQ") {
            if (!correctOptions || !Array.isArray(correctOptions)) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "correctOptions array is required for MCQ questions" 
                });
            }
            if (correctOptions.length === 0) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "At least one correct option must be specified for MCQ questions" 
                });
            }
        }

        const updatedEntry = await SolutionBank.findByIdAndUpdate(
            req.params.entryId,
            { 
                questionNumber, 
                correctOptions: correctOptions || [], // Ensure array
                correctSolution 
            },
            { new: true }
        ).populate('solutionRef');

        res.status(200).json({ status: "success", data: updatedEntry });

    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
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
                message: "Valid test ID is required" 
            });
        }

        // Validate solutionBank
        if (!solutionBank || !Array.isArray(solutionBank)) {
            return res.status(400).json({ 
                status: "error", 
                message: "Solutions data must be an array" 
            });
        }

        // Prepare bulk operations
        const updateOperations = solutionBank.map(entry => ({
            updateOne: {
                filter: { 
                    solutionRef: solutionId,
                    questionNumber: entry.questionNumber 
                },
                update: {
                    $set: {
                        correctOptions: entry.correctOptions || [],
                        correctSolution: entry.correctSolution || "",
                        isGrace: entry.isGrace || false
                    }
                }
            }
        }));

        // Execute bulk write
        const solutionResult = await SolutionBank.bulkWrite(updateOperations);
        
        // Update student reports if provided
        let reportResult = {};
        if (studentReports && Array.isArray(studentReports)) {
            const reportUpdates = studentReports.map(report => ({
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
                            responses: report.responses
                        }
                    }
                }
            }));
            
            reportResult = await StudentReport.bulkWrite(reportUpdates);
        }
        
        res.status(200).json({ 
            status: "success", 
            modifiedSolutions: solutionResult.modifiedCount,
            modifiedReports: reportResult.modifiedCount || 0,
            message: `Updated ${solutionResult.modifiedCount} solutions and ${reportResult.modifiedCount || 0} reports`
        });

    } catch (err) {
        console.error("Bulk update error:", err);
        res.status(400).json({ 
            status: "error", 
            message: err.message || "Failed to update solutions"
        });
    }
};

// Delete SolutionBank entry
exports.deleteSolutionBankById = async function (req, res) {
    try {
        const deletedEntry = await SolutionBank.findByIdAndDelete(req.params.entryId);

        if (!deletedEntry) {
            return res.status(404).json({ status: "error", message: "SolutionBank entry not found" });
        }

        res.status(200).json({ status: "success", message: "Entry deleted successfully" });

    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
    }
};
