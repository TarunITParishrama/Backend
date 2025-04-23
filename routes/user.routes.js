const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware"); // You'll need to create this
const router = express.Router();

// Public routes
router.post('/api/user/signup', userController.newSignup);
router.post('/api/user/login', userController.newlogin);

router.use(authMiddleware.protect); 

// Admin-only routes
router.get('/api/users', authMiddleware.restrictTo('admin', 'super_admin'), userController.getAllUsers);
router.patch('/api/users/:userId/approval', authMiddleware.restrictTo('admin', 'super_admin'), userController.updateApproval);
router.patch('/api/users/:userId/role', authMiddleware.restrictTo('super_admin'), userController.updateRole);
router.delete('/api/users/:userId', authMiddleware.restrictTo('super_admin'), userController.deleteUser);

module.exports = router;