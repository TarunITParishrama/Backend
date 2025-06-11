const express = require('express');
const mongoose = require('mongoose');
const Pattern = require('../models/Patterns');
const Subject = require('../models/Subjects');

// Create a new pattern
exports.createPattern = async function (req, res) {
  try {
    // Validate subjects exist
    const subjectIds = req.body.subjects.map(s => s.subject);
    const existingSubjects = await Subject.find({ _id: { $in: subjectIds } });
    
    if (existingSubjects.length !== subjectIds.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more subjects not found"
      });
    }

    // Calculate total marks from subjects if not provided
    if (!req.body.totalMarks) {
      req.body.totalMarks = req.body.subjects.reduce((sum, subject) => sum + subject.totalMarks, 0);
    }

    const data = await Pattern.create(req.body);
    res.status(201).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
}

// Get all patterns
exports.getPatterns = async function (req, res) {
  try {
    const { type } = req.query;

    const patternFilter = {};
    if (type) patternFilter.type = type;

    const data = await Pattern.find(patternFilter).populate('subjects.subject');
    
    // Calculate total marks for each pattern
    const patternsWithTotal = data.map(pattern => {
      const totalMarks = pattern.subjects.reduce(
        (sum, subject) => sum + (subject.totalMarks || subject.marks || 0), 
        0
      );
      return {
        ...pattern.toObject(),
        totalMarks
      };
    });

    res.status(200).json({
      status: "success",
      data: patternsWithTotal
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message
    });
  }
}

// Get patterns by type (LongTerm/PUC)
exports.getPatternsByType = async function (req, res) {
  try {
    const data = await Pattern.find({ type: req.params.type }).populate('subjects.subject');
    res.status(200).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message
    });
  }
}

// Get pattern by ID
exports.getPatternById = async function (req, res) {
  try {
    const data = await Pattern.findById(req.params.patternId).populate('subjects.subject');
    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Pattern not found"
      });
    }
    res.status(200).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message
    });
  }
}

// Update pattern by ID
exports.updatePatternById = async function (req, res) {
  try {
    // Validate subjects exist if they're being updated
    if (req.body.subjects) {
      const subjectIds = req.body.subjects.map(s => s.subject);
      const existingSubjects = await Subject.find({ _id: { $in: subjectIds } });
      
      if (existingSubjects.length !== subjectIds.length) {
        return res.status(400).json({
          status: "error",
          message: "One or more subjects not found"
        });
      }
    }

    const data = await Pattern.findByIdAndUpdate(
      req.params.patternId,
      req.body,
      { new: true, runValidators: true }
    ).populate('subjects.subject');
    
    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Pattern not found"
      });
    }
    
    res.status(200).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
}

// Delete pattern by ID
exports.deletePatternById = async function (req, res) {
  try {
    const data = await Pattern.findByIdAndDelete(req.params.patternId);
    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Pattern not found"
      });
    }
    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
}