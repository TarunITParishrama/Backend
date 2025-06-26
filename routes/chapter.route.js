const express = require("express");
const chapterController = require("../controllers/chapter.controller");
const router = express.Router();

router.post("/api/createchapter", chapterController.createChapter);
router.get("/api/getchapters", chapterController.getChapters);
router.get("/api/getchapterbyid/:chapterId", chapterController.getChapterById);
module.exports = router;
