const express = require('express')
const router = express.Router()
const subjectController = require('../controllers/subject.controller')

// Create

router.post("/api/createsubject",subjectController.createSubject)
router.get('/api/getsubjects',subjectController.getSubject)
router.get('/api/getsubjectByid/:subjectId',subjectController.getSubjectById)
module.exports = router