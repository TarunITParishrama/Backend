const TheoryTest = require('../models/theoryModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new theory test
// @route   POST /api/createtheory
// @access  Private
const createTheoryTest = asyncHandler(async (req, res) => {
  const { stream, testName, date, studentResults } = req.body;

  // Validate input
  if (!stream || !testName || !date || !studentResults || !Array.isArray(studentResults)) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  // Calculate percentage for each student
  const processedResults = studentResults.map(result => {
    const totalPossible = 145; // Assuming total marks is always 145 as per your example
    const percentage = (result.totalMarks / totalPossible) * 100;
    return {
      ...result,
      percentage: parseFloat(percentage.toFixed(2))
    };
  });

  const theoryTest = await TheoryTest.create({
    stream,
    testName,
    date: new Date(date),
    studentResults: processedResults
  });

  res.status(201).json({
    status: 'success',
    data: {
      theoryTest
    }
  });
});

// @desc    Get all theory tests
// @route   GET /api/gettheory
// @access  Private
const getTheoryTests = asyncHandler(async (req, res) => {
  const { stream, testName } = req.query;
  const query = {};
  
  if (stream) query.stream = stream;
  if (testName) query.testName = { $regex: testName, $options: 'i' };

  const tests = await TheoryTest.find(query)
    .sort({ date: -1 })
    .select('testName date stream studentResults'); 

  res.status(200).json({
    status: 'success',
    results: tests.length,
    data: {
      tests
    }
  });
});

// @desc    Get theory test by ID
// @route   GET /api/gettheory/:id
// @access  Private
const getTheoryTestById = asyncHandler(async (req, res) => {
  const test = await TheoryTest.findById(req.params.id);

  if (!test) {
    res.status(404);
    throw new Error('Theory test not found');
  }

  res.status(200).json({
    status: 'success',
    data: {
      test
    }
  });
});

// @desc    Get theory test results by registration number
// @route   GET /api/gettheory/student/:regNumber
// @access  Private
const getTheoryTestByRegNumber = asyncHandler(async (req, res) => {
  const { regNumber } = req.params;
  
  if (!/^\d{6}$/.test(regNumber)) {
    res.status(400);
    throw new Error('Invalid registration number format');
  }

  const tests = await TheoryTest.aggregate([
    { $unwind: '$studentResults' },
    { $match: { 'studentResults.regNumber': regNumber } },
    { 
      $project: {
        _id: 1,
        stream: 1,
        testName: 1,
        date: 1,
        subjectMarks: '$studentResults.subjectMarks',
        totalMarks: '$studentResults.totalMarks',
        percentage: '$studentResults.percentage'
      }
    },
    { $sort: { date: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    results: tests.length,
    data: {
      tests
    }
  });
});

module.exports = {
  createTheoryTest,
  getTheoryTests,
  getTheoryTestById,
  getTheoryTestByRegNumber
};