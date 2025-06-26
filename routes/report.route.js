const express = require("express");
const reportController = require("../controllers/report.controller");
const router = express.Router();

// Report routes
router.post("/api/createreport", reportController.createReport);

router.get("/api/getreportbank", reportController.getReportBank);
router.get("/api/getallreports", reportController.getAllReportBank);
router.get("/api/getreport/:id", reportController.getReportById);

router.put("/api/updatereport/:reportId", reportController.updateReportById);
router.delete("/api/deletereport/:reportId", reportController.deleteReportById);

// ReportBank routes
router.put(
  "/api/updatereportbank/:entryId",
  reportController.updateReportBankById
);
router.delete(
  "/api/deletereportbank/:entryId",
  reportController.deleteReportBankById
);

module.exports = router;
