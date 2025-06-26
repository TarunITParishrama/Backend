const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const router = express.Router();

// Public routes (no protection)
router.post("/api/user/signup", userController.newSignup);
router.post("/api/user/login", userController.newlogin);
router.post("/api/parent/login", authMiddleware.parentLogin);

// Protected routes (require auth)
router.use(authMiddleware.protect); // Now this only applies to routes below

// Admin-only routes
router.get(
  "/api/users",
  authMiddleware.restrictTo("admin", "super_admin"),
  userController.getAllUsers
);
router.patch(
  "/api/users/:userId/approval",
  authMiddleware.restrictTo("admin", "super_admin"),
  userController.updateApproval
);
router.patch(
  "/api/users/:userId/role",
  authMiddleware.restrictTo("super_admin"),
  userController.updateRole
);
router.delete(
  "/api/users/:userId",
  authMiddleware.restrictTo("super_admin"),
  userController.deleteUser
);

module.exports = router;
