const express = require("express");
const router = express.Router();
const foodController = require("../controllers/hostelfood.controller");

router.post("/api/createfood", foodController.createFood);
router.get("/api/getallfood", foodController.getAllFood);
router.get("/api/getfoodforcampus/:campusId", foodController.getFoodForCampus);
router.put("/api/updatefood/:id", foodController.updateFood);
router.delete("/api/deletefood/:id", foodController.deleteFood);

module.exports = router;
