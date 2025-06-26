const express = require("express");
const router = express.Router();
const campusController = require("../controllers/campus.controller");

// Campus CRUD routes
router.post("/api/createcampus", campusController.createCampus);
router.get("/api/getcampuses", campusController.getAllCampuses);
router.put("/api/updatecampus/:id", campusController.updateCampus);
router.delete("/api/deletecampus/:id", campusController.deleteCampus);

module.exports = router;
