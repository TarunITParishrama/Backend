const express = require('express');
const theoryController = require('../controllers/theorymodel.controller');

const router = express.Router();

router.post('/api/createtheory', theoryController.createTheoryTest);
router.get('/api/gettheory', theoryController.getTheoryTests);
router.get('/api/gettheory/:id', theoryController.getTheoryTestById);
router.get('/api/gettheory/student/:regNumber', theoryController.getTheoryTestByRegNumber);

module.exports = router;