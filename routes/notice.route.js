const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");

// No auth middleware needed
router.post("/api/notices", noticeController.createNotice);
router.get("/api/notices/active", noticeController.getActiveNotices);
router.get("/api/notices", noticeController.getAllNotices);
router.delete("/api/notices/:id", noticeController.deleteNotice);

module.exports = router;
