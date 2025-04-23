const express = require("express");
const detailedReportController = require("../controllers/detailedreport.controller");
const router = express.Router();

// DetailedReport CRUD Endpoints
router.post(
  "/api/createdetailedreports",
  detailedReportController.createDetailedReport
);
router.get(
  "/api/getdetailedreports",
  detailedReportController.getDetailedReports
);
router.get(
  "/api/getdetailedreportsbyid/:id",
  detailedReportController.getDetailedReportById
);
router.get(
  "/api/getdetailedreportsbystudentid/:regNumber",
  detailedReportController.getDetailedReportsByStudentId
);
router.put(
  "/api/updatedetailedreportsbyid/:id",
  detailedReportController.updateDetailedReport
);
router.delete(
  "/api/deletedetailedreportsbyid/:id",
  detailedReportController.deleteDetailedReport
);

module.exports = router;