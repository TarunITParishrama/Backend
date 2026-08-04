const { getPerformanceLevel } = require("./performance.util");

/**
 * Parent-friendly display names
 */
const GROUP_DISPLAY_NAMES = {
  PDT: "Parishrama Daily Tests",
  PWT: "Parishrama Weekly Tests",

  LIPDT: "LongTerm Phase 1 Daily Tests",
  LIIPDT: "LongTerm Phase 2 Daily Tests",

  IPDT: "11th PUC Daily Tests",
  IIPDT: "12th PUC Daily Tests",

  BPCT: "Bridge Course Competitive Tests",
  BPWT: "Bridge Course Weekly Tests",

  DSPDT: "Day Scholars Daily Tests",
  PDTDS: "Day Scholars Daily Tests",
};

/**
 * Returns group code from test name
 * Example:
 * PDT-01 -> PDT
 * GPBT-03 -> GPBT
 */
function getGroupCode(testName = "") {
  return testName.split("-")[0].trim().toUpperCase();
}

/**
 * Returns display name for a group.
 * Unknown groups fall back to their group code.
 */
function getGroupDisplayName(groupCode, stream) {
  // PCT has different names for different streams
  if (groupCode === "PCT") {
    return stream === "PUC"
      ? "Parishrama Competitive Tests"
      : "Parishrama Cumulative Tests";
  }

  return GROUP_DISPLAY_NAMES[groupCode] || groupCode;
}

/**
 * Build Report Summary
 *
 * @param {Array} reports
 * @param {Array} patterns
 */
exports.buildReportSummary = function (reports = [], patterns = []) {
  if (!reports.length) {
    return {
      student: null,
      groups: [],
    };
  }

  /**
   * Student Info
   */
  const student = {
    regNumber: reports[0].regNumber,
    studentName: reports[0].studentName,
    stream: reports[0].stream,
    campus: reports[0].campus,
    section: reports[0].section,
  };

  /**
   * Group reports
   */
  const groupedReports = {};

  for (const report of reports) {
    const groupCode = getGroupCode(report.testName);

    if (!groupedReports[groupCode]) {
      groupedReports[groupCode] = [];
    }

    groupedReports[groupCode].push(report);
  }

  /**
   * Build analytics
   */
  const patternMap = new Map(
    patterns.map((pattern) => [pattern.testName, pattern]),
  );
  const groups = Object.entries(groupedReports).map(
    ([groupCode, groupReports]) => {
      /**
       * Sort reports chronologically
       */
      groupReports.sort((a, b) => new Date(a.date) - new Date(b.date));

      /**
       * Find Pattern
       */
      const pattern = patternMap.get(groupCode) || null;
      /**
       * Present Reports
       */
      const presentReports = groupReports.filter((r) => r.isPresent);

      const absentCount = groupReports.length - presentReports.length;

      /**
       * Scores
       */
      const scores = presentReports.map((r) => r.overallTotalMarks);

      const percentages = presentReports.map((r) => r.percentage);

      const highest = scores.length ? Math.max(...scores) : 0;

      const lowest = scores.length ? Math.min(...scores) : 0;

      const average = scores.length
        ? Number(
            (scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(
              2,
            ),
          )
        : 0;

      const highestPercentage = percentages.length
        ? Math.max(...percentages)
        : 0;

      const averagePercentage = percentages.length
        ? Number(
            (
              percentages.reduce((sum, val) => sum + val, 0) /
              percentages.length
            ).toFixed(2),
          )
        : 0;

      const latest = groupReports[groupReports.length - 1];

      /**
       * Trend
       *
       * Version 1
       */
      let trend = "stable";

      if (scores.length >= 2) {
        const previous = scores[scores.length - 2];

        const current = scores[scores.length - 1];

        if (current > previous) trend = "up";

        if (current < previous) trend = "down";
      }

      /**
       * Performance
       */
      const performance = getPerformanceLevel(averagePercentage);

      /**
       * History
       */
      const history = groupReports.map((report) => ({
        testName: report.testName,

        date: report.date,

        score: report.overallTotalMarks,

        percentage: report.percentage,

        percentile: report.percentile,

        rank: report.rank,

        isPresent: report.isPresent,
      }));

      return {
        groupCode,

        groupName: getGroupDisplayName(groupCode, student.stream),
        category: pattern && pattern.totalMarks > 180 ? "weekly" : "daily",
        pattern: pattern
          ? {
              _id: pattern._id,
              testName: pattern.testName,
              totalMarks: pattern.totalMarks,
            }
          : null,

        analytics: {
          totalTests: groupReports.length,

          presentTests: presentReports.length,

          absentTests: absentCount,

          highest,

          lowest,

          average,

          latest: latest.overallTotalMarks,

          latestPercentage: latest.percentage,

          averagePercentage,

          highestPercentage,

          trend,

          performanceStatus: performance.performanceStatus,

          performanceScore: performance.performanceScore,
        },

        history,

        tests: groupReports,
      };
    },
  );

  /**
   * Latest active groups first
   */
  groups.sort((a, b) => {
    const aDate = new Date(a.history[a.history.length - 1]?.date);

    const bDate = new Date(b.history[b.history.length - 1]?.date);

    return bDate - aDate;
  });

  return {
    student,
    groups,
  };
};

exports.getGroupCode = getGroupCode;
exports.getGroupDisplayName = getGroupDisplayName;
