const express = require("express");
const Question = require("../models/Questions");
const Subject = require("../models/Subjects");
const Chapter = require("../models/Chapters");
const Subtopic = require("../models/Subtopic");
const mongoose = require("mongoose");
const sharp = require("sharp");

exports.createQuestion = async function (req, res) {
  try {
    const {
      subject,
      chapter,
      subtopic,
      questionText,
      questionType,
      options,
      solution,
    } = req.body;
    let questionImage, solutionImage;

    // Fetch Subject, Chapter, and Subtopic based on names
    const subjectDoc = await Subject.findOne({ subjectName: subject });
    if (!subjectDoc) throw new Error("Subject not found");

    const chapterDoc = await Chapter.findOne({
      chapterName: chapter,
      subject: subjectDoc._id,
    });
    if (!chapterDoc) throw new Error("Chapter not found under this subject");

    const subtopicDoc = await Subtopic.findOne({
      subtopicName: subtopic,
      chapter: chapterDoc._id,
    });
    if (!subtopicDoc) throw new Error("Subtopic not found under this chapter");

    // Compress images if provided
    if (req.files?.questionImage) {
      questionImage = await compressImage(req.files.questionImage);
    }
    if (req.files?.solutionImage) {
      solutionImage = await compressImage(req.files.solutionImage);
    }

    // Validate options for MCQ
    if (questionType === "MCQ" && (!options || !options.length)) {
      return res
        .status(400)
        .json({ status: "error", message: "Options required for MCQ" });
    }

    // Create the question
    const question = await Question.create({
      subject: subjectDoc._id,
      chapter: chapterDoc._id,
      subtopic: subtopicDoc._id,
      questionText,
      questionImage,
      questionType,
      options: questionType === "MCQ" ? options : [],
      solution,
      solutionImage,
    });

    res.status(201).json({ status: "success", data: question });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.getQuestions = async function (req, res) {
  try {
    const { subject, chapter, subtopic } = req.query;

    if (!subject || !chapter || !subtopic) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Subject, Chapter, and Subtopic are required",
        });
    }

    // Find references based on names
    const subjectDoc = await Subject.findOne({ subjectName: subject });
    if (!subjectDoc) throw new Error("Subject not found");

    const chapterDoc = await Chapter.findOne({
      chapterName: chapter,
      subject: subjectDoc._id,
    });
    if (!chapterDoc) throw new Error("Chapter not found under this subject");

    const subtopicDoc = await Subtopic.findOne({
      subtopicName: subtopic,
      chapter: chapterDoc._id,
    });
    if (!subtopicDoc) throw new Error("Subtopic not found under this chapter");

    // Fetch Questions
    const questions = await Question.find({ subtopic: subtopicDoc._id })
      .populate("subject", "subjectName")
      .populate("chapter", "chapterName")
      .populate("subtopic", "subtopicName");

    res.status(200).json({ status: "success", data: questions });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getQuestionById = async function (req, res) {
  try {
    const question = await Question.findById(req.params.questionId)
      .populate("subject", "subjectName")
      .populate("chapter", "chapterName")
      .populate("subtopic", "subtopicName");

    if (!question) {
      return res
        .status(404)
        .json({ status: "error", message: "Question not found" });
    }

    res.status(200).json({ status: "success", data: question });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.updateQuestionById = async function (req, res) {
  try {
    const { questionText, questionType, options, solution } = req.body;
    let questionImage, solutionImage;

    if (req.files?.questionImage) {
      questionImage = await compressImage(req.files.questionImage);
    }
    if (req.files?.solutionImage) {
      solutionImage = await compressImage(req.files.solutionImage);
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.questionId,
      {
        questionText,
        questionImage,
        questionType,
        options: questionType === "MCQ" ? options : [],
        solution,
        solutionImage,
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return res
        .status(404)
        .json({ status: "error", message: "Question not found" });
    }

    res.status(200).json({ status: "success", data: updatedQuestion });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

exports.deleteQuestionById = async function (req, res) {
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);

    if (!question) {
      return res
        .status(404)
        .json({ status: "error", message: "Question not found" });
    }

    res
      .status(200)
      .json({ status: "success", message: "Question deleted successfully" });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Function to compress images
async function compressImage(imageFile) {
  const buffer = await sharp(imageFile.data)
    .resize(500) // Resize to 500px width, maintain aspect ratio
    .jpeg({ quality: 70 }) // Compress JPEG to 70% quality
    .toBuffer();
  return buffer.toString("base64"); // Convert to base64
}
