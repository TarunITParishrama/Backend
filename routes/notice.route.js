const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");
const authMiddleware = require("../middleware/auth.middleware")

// No auth middleware needed
router.post("/api/notices",authMiddleware.protect, noticeController.createNotice);
router.get("/api/notices/active", noticeController.getActiveNotices);
router.get("/api/notices", noticeController.getAllNotices);
router.delete("/api/notices/:id", noticeController.deleteNotice);
router.get("/api/notices/active/:campusId", noticeController.getActiveNoticesByCampus);

module.exports = router;
