const express = require("express");
const solutionController = require("../controllers/solution.controller");
const router = express.Router();

// Solution routes
router.post("/api/createsolution", solutionController.createSolution);
router.get("/api/getsolutionbank", solutionController.getSolutionBank);
router.put("/api/updatesolution/:solutionId", solutionController.updateSolutionById);
router.delete("/api/deletesolution/:solutionId", solutionController.deleteSolutionById);

// SolutionBank routes
router.put("/api/updatesolutionbank/:entryId", solutionController.updateSolutionBankById);
router.put("/api/updatesolutionsinbulk", solutionController.updateSolutionsInBulk);
router.delete("/api/deletesolutionbank/:entryId", solutionController.deleteSolutionBankById);

module.exports = router;