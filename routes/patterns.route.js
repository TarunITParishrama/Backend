const express = require('express');
const router = express.Router();
const patternController = require('../controllers/patterns.controller');

// Create
router.post("/api/createpatterns", patternController.createPattern);

// Read
router.get('/api/getpatterns', patternController.getPatterns);
router.get('/api/getpatterns/type/:type', patternController.getPatternsByType);
router.get('/api/getpatterns/:patternId', patternController.getPatternById);

// Update
router.put('/api/updatepatterns/:patternId', patternController.updatePatternById);

// Delete
router.delete('/api/deletepatterns/:patternId', patternController.deletePatternById);

module.exports = router;