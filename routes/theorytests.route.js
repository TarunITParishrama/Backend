const express = require("express");
const router = express.Router();
const theoryTestController = require("../controllers/theorytests.controller");

// Create a new theory test
router.post("/api/createtheory", theoryTestController.createTheoryTest);

// Get all theory tests
router.get("/api/gettheorytests", theoryTestController.getAllTheoryTests);

// Get theory tests by stream
router.get("/api/gettheorytests/:stream", theoryTestController.getTheoryTestsByStream);

// Get student's theory test results
router.get("/api/getstudenttheory/:regNumber", theoryTestController.getStudentTheoryResults);

// Get specific theory test by ID
router.get("/api/gettheorytest/:testId", theoryTestController.getTheoryTestById);

module.exports = router;