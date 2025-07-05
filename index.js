require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
