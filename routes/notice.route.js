const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/notice.controller');
const authController = require('../middleware/auth.middleware');

// Parent access
router.get(
  '/api/notices/active',
  authController.protect,
  noticeController.getActiveNotices
);

// Admin/Staff access
// router.use(authController.protect, authController.restrictTo('super_admin','admin', 'staff'));

router.post(
  '/api/notices',
  noticeController.createNotice
);

router.get(
  '/api/notices',
  noticeController.getAllNotices
);

router.delete(
  '/api/notices/:id',
  noticeController.deleteNotice
);

module.exports = router;