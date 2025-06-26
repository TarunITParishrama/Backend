const express = require("express");
const router = express.Router();
const detailedReportController = require("../controllers/detailedreport.controller");

// DetailedReport endpoints
router.post(
  "/api/detailedreports",
  detailedReportController.createDetailedReport
);
router.post(
  "/api/detailedreports/bulk",
  detailedReportController.bulkUploadDetailedReports
);
router.get("/api/detailedreports", detailedReportController.getDetailedReports);
router.get(
  "/api/detailedreports/:id",
  detailedReportController.getDetailedReportById
);
router.get(
  "/api/students/:regNumber/reports",
  detailedReportController.getDetailedReportsByStudentId
);
router.get(
  "/api/students/:regNumber/performance",
  detailedReportController.getStudentTestPerformance
);

router.get(
  "/api/loaddetailedreports",
  detailedReportController.loadDetailedReportsByCampus
);

router.put(
  "/api/detailedreports/:id",
  detailedReportController.updateDetailedReport
);
router.delete(
  "/api/detailedreports/:id",
  detailedReportController.deleteDetailedReport
);

module.exports = router;
