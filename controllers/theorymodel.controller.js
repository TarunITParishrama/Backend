const TheoryTest = require('../models/theoryModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new theory test
// @route   POST /api/createtheory
// @access  Private
const createTheoryTest = asyncHandler(async (req, res) => {
  const { stream, testName, date, subjectDetails, studentResults } = req.body;

  // Validate input
  if (!stream || !testName || !date || !subjectDetails || !studentResults || !Array.isArray(studentResults)) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  // Validate subject details
  if (!Array.isArray(subjectDetails) || subjectDetails.length !== 4) {
    res.status(400);
    throw new Error('Exactly 4 subjects are required');
  }

  // Process student results with calculated values
  const processedResults = studentResults.map(result => {
    const totalMarks = Object.values(result.subjectMarks).reduce((sum, mark) => sum + (mark || 0), 0);
    const totalPossible = subjectDetails.reduce((sum, sub) => sum + sub.maxMarks, 0);
    const percentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
    
    return {
      ...result,
      totalMarks,
      percentage: parseFloat(percentage.toFixed(2))
    };
  });

  const theoryTest = await TheoryTest.create({
    stream,
    testName,
    date: new Date(date),
    subjectDetails,
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

  try {
    const tests = await TheoryTest.find(query)
      .sort({ date: -1 })
      .select('testName date stream subjectDetails studentResults')
      .lean(); // Convert to plain JavaScript objects

    // Process the data to ensure consistent structure
    const processedTests = tests.map(test => ({
      _id: test._id,
      testName: test.testName,
      date: test.date,
      stream: test.stream,
      subjectDetails: test.subjectDetails || [
        { name: "Physics", maxMarks: 35 },
        { name: "Chemistry", maxMarks: 35 },
        { name: "Biology", maxMarks: 35 },
        { name: "Mathematics", maxMarks: 40 }
      ],
      studentResults: (test.studentResults || []).map(result => ({
        regNumber: result.regNumber,
        subjectMarks: result.subjectMarks instanceof Map ? 
          Object.fromEntries(result.subjectMarks) : 
          result.subjectMarks,
        totalMarks: result.totalMarks,
        percentage: result.percentage
      }))
    }));

    res.status(200).json({
      status: 'success',
      results: processedTests.length,
      data: {
        tests: processedTests
      }
    });
  } catch (error) {
    console.error('Error fetching theory tests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch theory tests'
    });
  }
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