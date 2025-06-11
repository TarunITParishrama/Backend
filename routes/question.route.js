const express = require("express");
const questionController = require("../controllers/question.controller");
const router = express.Router();

router.post("/api/createquestion", questionController.createQuestion);
router.get("/api/getquestions", questionController.getQuestions);
router.get("/api/getquestionbyid/:questionId", questionController.getQuestionById);
// router.put("/api/updatequestionbyid/:questionId", questionController.updateQuestionById);
// router.delete("/api/deletequestionbyid/:questionId", questionController.deleteQuestionById);

module.exports = router;
