const express = require('express')
const router = express.Router()
const subjectController = require('../controllers/subject.controller')
const authMiddleware = require("../middleware/auth.middleware")

// Create

router.post("/api/createsubject",subjectController.createSubject)
router.get('/api/getsubjects', authMiddleware.protect, subjectController.getSubjects);
router.get('/api/getsubjectByid/:subjectId',subjectController.getSubjectById)
module.exports = router