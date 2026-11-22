const DetailedReport = require("../models/DetailedReports");
const { getPerformanceLevel } = require("../utils/performance.util");

// Parent-friendly test group names
const GROUP_DISPLAY_NAMES = {
  PDT: "Parishrama Daily Tests",
  PWT: "Parishrama Weekly Tests",
  LIPDT: "LongTerm Phase 1 Daily Tests",
  LIIPDT: "LongTerm Phase 2 Daily Tests",
  IPDT: "11th PUC Daily Tests",
  IIPDT: "12th PUC Daily Tests",
  BPC: "Bridge Course Competitive Tests",
  BPW: "Bridge Course Weekly Tests",
  DSPD: "Day Scholars Daily Tests",
  PDTDS: "Day Scholars Daily Tests",
};

function getGroupCode(testName = "") {
  return testName.split("-")[0].trim().toUpperCase();
}

function getGroupDisplayName(groupCode, stream) {
  if (groupCode === "PCT") {
    return stream === "PUC"
      ? "Parishrama Competitive Tests"
      : "Parishrama Cumulative Tests";
  }

  return GROUP_DISPLAY_NAMES[groupCode] || groupCode;
}

function getStudentStream(student) {
  if (student.stream === "LongTerm" || student.stream === "PUC") {
    return student.stream;
  }

  if (student.allotmentType === "LongTerm") {
    return "LongTerm";
  }

  if (String(student.allotmentType || "").includes("PUC")) {
    return "PUC";
  }

  return null;
}

function calculateAverage(values = []) {
  const validValues = values.map(Number).filter(Number.isFinite);

  if (!validValues.length) return null;

  return Number(
    (
      validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    ).toFixed(2),
  );
}

function getTrend(values = []) {
  const validValues = values.map(Number).filter(Number.isFinite);

  if (validValues.length < 4) {
    return {
      direction: "insufficient_data",
      difference: null,
      recentAverage: null,
      previousAverage: null,
    };
  }

  const recentScores = validValues.slice(-3);
  const previousScores = validValues.slice(-6, -3);

  if (recentScores.length < 2 || previousScores.length < 2) {
    return {
      direction: "insufficient_data",
      difference: null,
      recentAverage: null,
      previousAverage: null,
    };
  }

  const recentAverage = calculateAverage(recentScores);
  const previousAverage = calculateAverage(previousScores);
  const difference = Number((recentAverage - previousAverage).toFixed(2));

  let direction = "stable";

  if (difference >= 2) {
    direction = "improving";
  } else if (difference <= -2) {
    direction = "declining";
  }

  return {
    direction,
    difference,
    recentAverage,
    previousAverage,
  };
}

function getReportPercentage(report) {
  const percentage = Number(report.percentage);

  if (!Number.isFinite(percentage)) return null;

  return percentage;
}

function getSubjectPerformance(reports = []) {
  const subjectMap = new Map();

  for (const report of reports) {
    if (!report.isPresent || !Array.isArray(report.subjects)) {
      continue;
    }

    for (const subject of report.subjects) {
      const name = String(subject.subjectName || "").trim();

      const scored = Number(subject.scored);
      const totalMarks = Number(subject.totalMarks);

      if (
        !name ||
        !Number.isFinite(scored) ||
        !Number.isFinite(totalMarks) ||
        totalMarks <= 0
      ) {
        continue;
      }

      const percentage = Number(((scored / totalMarks) * 100).toFixed(2));

      if (!subjectMap.has(name)) {
        subjectMap.set(name, []);
      }

      subjectMap.get(name).push({
        testName: report.testName,
        date: report.date,
        scored,
        totalMarks,
        percentage,
      });
    }
  }

  return Array.from(subjectMap.entries()).map(([subjectName, history]) => {
    const trend = getTrend(history.map((item) => item.percentage));

    return {
      subjectName,
      latest: history[history.length - 1],
      averagePercentage: calculateAverage(
        history.map((item) => item.percentage),
      ),
      trend,
      testsAnalysed: history.length,
      history: history.slice(-6),
    };
  });
}

function formatReport(report) {
  return {
    testName: report.testName,
    date: report.date,
    attendance: report.isPresent ? "Present" : "Absent",
    marks: report.isPresent
      ? {
          scored: report.overallTotalMarks,
          total: report.fullMarks,
        }
      : null,
    percentage: report.isPresent ? getReportPercentage(report) : null,
    percentile: report.isPresent ? report.percentile : null,
    rank: report.isPresent ? report.rank : null,
    performance:
      report.isPresent && getReportPercentage(report) !== null
        ? getPerformanceLevel(getReportPercentage(report))
        : null,
  };
}

function buildGroupAnalytics(groupCode, reports, stream) {
  // Reports are sorted chronologically, oldest first.
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const presentReports = sortedReports.filter(
    (report) => report.isPresent === true,
  );

  const percentages = presentReports
    .map(getReportPercentage)
    .filter((value) => value !== null);

  const marks = presentReports
    .map((report) => Number(report.overallTotalMarks))
    .filter(Number.isFinite);

  const latestConducted = sortedReports[sortedReports.length - 1] || null;

  const latestAttended = presentReports[presentReports.length - 1] || null;

  const averagePercentage = calculateAverage(percentages);

  const performance =
    averagePercentage !== null ? getPerformanceLevel(averagePercentage) : null;

  return {
    groupCode,
    groupName: getGroupDisplayName(groupCode, stream),

    analytics: {
      totalTests: sortedReports.length,
      attendedTests: presentReports.length,
      absentTests: sortedReports.length - presentReports.length,

      averageMarks: calculateAverage(marks),

      highestMarks: marks.length ? Math.max(...marks) : null,

      lowestMarks: marks.length ? Math.min(...marks) : null,

      averagePercentage,
      highestPercentage: percentages.length ? Math.max(...percentages) : null,

      trend: getTrend(percentages),

      performanceStatus: performance?.performanceStatus || null,

      performanceScore: performance?.performanceScore || null,
    },

    latestConducted: latestConducted ? formatReport(latestConducted) : null,

    latestAttended: latestAttended ? formatReport(latestAttended) : null,

    subjectPerformance: getSubjectPerformance(presentReports),

    recentHistory: sortedReports.slice(-8).reverse().map(formatReport),
  };
}

/**
 * Retrieves and analyses academic records for an authenticated student.
 *
 * IMPORTANT:
 * The caller must provide a Student document resolved from the
 * authenticated parent token. Never pass a frontend regNumber here.
 */
exports.getStudentAcademicContext = async function (student) {
  if (!student || !student._id || !student.regNumber) {
    throw new Error("A valid authenticated student is required");
  }

  const reports = await DetailedReport.find({
    regNumber: student.regNumber,
  })
    .sort({ date: 1 })
    .limit(100)
    .lean();

  const stream = getStudentStream(student);

  if (!reports.length) {
    return {
      student: {
        name: student.studentName,
        stream,
      },
      hasAcademicRecords: false,
      message: "No academic test records are currently available.",
      groups: [],
    };
  }

  // Keep different streams and test groups separate.
  const groupedReports = new Map();

  for (const report of reports) {
    const groupCode = getGroupCode(report.testName);
    const key = `${report.stream}:${groupCode}`;

    if (!groupedReports.has(key)) {
      groupedReports.set(key, {
        groupCode,
        stream: report.stream,
        reports: [],
      });
    }

    groupedReports.get(key).reports.push(report);
  }

  const groups = Array.from(groupedReports.values())
    .map((group) =>
      buildGroupAnalytics(group.groupCode, group.reports, group.stream),
    )
    .sort((a, b) => {
      const aDate = new Date(a.latestConducted?.date || 0);
      const bDate = new Date(b.latestConducted?.date || 0);

      return bDate - aDate;
    });

  const latestConducted = [...reports].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )[0];

  const latestAttended =
    [...reports]
      .filter((report) => report.isPresent === true)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  return {
    student: {
      name: student.studentName,
      stream,
      section: student.section,
    },

    hasAcademicRecords: true,

    totalReports: reports.length,

    latestConducted: formatReport(latestConducted),

    latestAttended: latestAttended ? formatReport(latestAttended) : null,

    groups,
  };
};
