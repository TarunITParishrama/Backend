const TheoryTest = require("../models/TheoryTest");
const Subject = require("../models/Subjects");

// Create a new theory test
exports.createTheoryTest = async (req, res) => {
  try {
    // Validate subject details with Subject model
    const subjects = await Subject.find();
    const subjectNames = subjects.map(sub => sub.subjectName.toLowerCase());
    
    for (const subDetail of req.body.subjectDetails) {
      if (!subjectNames.includes(subDetail.name.toLowerCase())) {
        return res.status(400).json({
          status: "error",
          message: `Invalid subject: ${subDetail.name}`
        });
      }
    }

    const theoryTest = await TheoryTest.create(req.body);
    
    res.status(201).json({
      status: "success",
      data: theoryTest
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get all theory tests
exports.getAllTheoryTests = async (req, res) => {
  try {
    const tests = await TheoryTest.find();
    res.status(200).json({
      status: "success",
      data: tests
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get theory tests by stream
exports.getTheoryTestsByStream = async (req, res) => {
  try {
    const tests = await TheoryTest.find({ stream: req.params.stream });
    res.status(200).json({
      status: "success",
      data: tests
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get student's theory test results by regNumber
exports.getStudentTheoryResults = async (req, res) => {
  try {
    const tests = await TheoryTest.find({
      "studentResults.regNumber": req.params.regNumber
    });
    
    res.status(200).json({
      status: "success",
      data: tests
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get specific theory test by ID
exports.getTheoryTestById = async (req, res) => {
  try {
    const test = await TheoryTest.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({
        status: "error",
        message: "Test not found"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: test
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};