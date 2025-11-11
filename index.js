require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const {updateNotices} = require("./controllers/noticeController.js");
// import cron from "node-cron";
// import { updateNotices } from "./controllers/noticeController.js";
// import mongoose from "mongoose";
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  cron.schedule("0 * * * *", async () => { // runs hourly
    try {
      await updateNotices();
      console.log("✅ Notices updated successfully");
    } catch (err) {
      console.error("[CRON ERROR]", err);
    }
  });
)
.catch(err => console.error("❌ MongoDB connection failed:", err));


const SubjectRoute = require("./routes/subject.route");
app.use("/", SubjectRoute);

const ChapterRoute = require("./routes/chapter.route");
app.use("/", ChapterRoute);

const SubtopicRoute = require("./routes/subtopic.route");
app.use("/", SubtopicRoute);

const QuestionRoute = require("./routes/question.route");
app.use("/", QuestionRoute);

const SolutionRoute = require("./routes/solution.route");
app.use("/", SolutionRoute);

const ReportRoute = require("./routes/report.route");
app.use("/", ReportRoute);

const StudentReportRoute = require("./routes/studentreport.route");
app.use("/", StudentReportRoute);

const TheoryTestsRoute = require("./routes/theorytests.route");
app.use("/", TheoryTestsRoute);

const GatePassRoutes = require("./routes/gatepass.route");
app.use("/", GatePassRoutes);

const NoticeRoutes = require("./routes/notice.route");
require("./controllers/notice.controller");
app.use("/", NoticeRoutes);

const TestResultsRoutes = require("./routes/testresults.route");
app.use("/", TestResultsRoutes);

const UserModelRoute = require("./routes/user.routes");
app.use("/", UserModelRoute);

const StudentRoute = require("./routes/students.route");
app.use("/", StudentRoute);

const AttendanceRoute = require("./routes/attendance.route");
app.use("/", AttendanceRoute);

const CampusRoute = require("./routes/campus.route");
app.use("/", CampusRoute);

const PatternsRoute = require("./routes/patterns.route");
app.use("/", PatternsRoute);

const DetailedReportRoute = require("./routes/detailedreport.route");
app.use("/", DetailedReportRoute);

const FeedbackRoute = require("./routes/feedback.route");
app.use("/", FeedbackRoute);

const ProfileRoute = require("./routes/profile.route")
app.use("/", ProfileRoute);

const ParentFeedbackRoute = require("./routes/parentfeedback.route");
app.use("/", ParentFeedbackRoute);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
