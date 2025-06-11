const express = require('express');
const testResultsController = require('../controllers/testresults.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// TestResults routes
router.post("/api/checkexistingtestresults", authMiddleware.protect, testResultsController.checkExistingResults);
router.post("/api/createtestresults", authMiddleware.protect, testResultsController.createTestResults);
router.get("/api/gettestresultsbystudent/:regNumber", authMiddleware.protect, testResultsController.getResultsByRegNumber);
router.get("/api/gettestresultsbytest/:testName", authMiddleware.protect, testResultsController.getResultsByTest);
// In your testresults.routes.js
router.put("/api/updatepresencestatus", authMiddleware.protect, testResultsController.updatePresenceStatus);
router.get("/api/getabsentstudents", authMiddleware.protect, testResultsController.getAbsentStudents); 
router.get("/api/getalltestnames", authMiddleware.protect, testResultsController.getAllTestNames);

module.exports = router;