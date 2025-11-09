const express = require("express");
const router = express.Router();
const controller = require("../controllers/parentfeedback.controller");
const auth = require("../middleware/auth.middleware");

router.post("/api/createparentfeedback", auth.protect, controller.create);
router.get("/api/parentfeedbacks", auth.protect, controller.list);
router.get("/api/parentfeedbacks/:id", auth.protect, controller.get);
router.put("/api/parentfeedbacks/:id", auth.protect, controller.update);
router.delete("/api/parentfeedbacks/:id", auth.protect, controller.remove);

module.exports = router;
