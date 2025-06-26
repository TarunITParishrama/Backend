const express = require("express");
const subtopicController = require("../controllers/subtopic.controller");
const router = express.Router();

router.post("/api/createsubtopic", subtopicController.createSubtopic);
router.get("/api/getsubtopic", subtopicController.getSubtopics);
router.get(
  "/api/getsubtopicbyId/:subtopicId",
  subtopicController.getSubtopicById
);
module.exports = router;
