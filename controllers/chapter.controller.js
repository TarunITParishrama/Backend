const express = require("express");
const Chapter = require("../models/Chapters");
const mongoose = require("mongoose");

const Subject = require("../models/Subjects");
exports.createChapter = async function (req, res) {
  try {
    let { chapterName, subject } = req.body; // subject can be a name or ID

    // Check if the subject is provided
    if (!subject) {
      return res.status(400).json({
        status: "error",
        message: "Subject name is required",
      });
    }

    let subjectId;
    if (mongoose.Types.ObjectId.isValid(subject)) {
      // If subject is already an ObjectId, use it directly
      subjectId = subject;
    } else {
      // If subject is a name, find the ObjectId from the database
      const subjectData = await Subject.findOne({ subjectName: subject });
      if (!subjectData) {
        return res.status(400).json({
          status: "error",
          message: `Subject '${subject}' does not exist.`,
        });
      }
      subjectId = subjectData._id; // Get the ObjectId
    }

    // Create the chapter using the found subjectId
    const data = await Chapter.create({ chapterName, subject: subjectId });

    res.status(201).json({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.getChapters = async function (req, res) {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({
        status: "error",
        message: "Subject name or ObjectId is required",
      });
    }

    let subjectId;
    if (mongoose.Types.ObjectId.isValid(subject)) {
      // If subject is already an ObjectId, use it
      subjectId = subject;
    } else {
      // Find subject by name and get its ObjectId
      const subjectData = await Subject.findOne({ subjectName: subject });
      if (!subjectData) {
        return res.status(400).json({
          status: "error",
          message: `Subject '${subject}' does not exist.`,
        });
      }
      subjectId = subjectData._id;
    }

    // Find all chapters associated with the subject
    const data = await Chapter.find({ subject: subjectId }).populate("subject");

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.getChapterById = async function (req, res) {
  try {
    const data = await Chapters.findById(req.params.chapterId).populate(
      "subject"
    );
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.updateChapterById = async function (req, res) {
  try {
    const data = await Chapters.findByIdAndUpdate(
      req.params.chapterId,
      req.body
    );
    res.status(201).json({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.deleteChapterById = async function (req, res) {
  try {
    const data = await Chapters.findByIdAndDelete(req.params.chapterId);
    res.status(201).json({
      status: "success",
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};
