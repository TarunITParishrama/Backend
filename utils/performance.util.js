exports.getPerformanceLevel = function (percentage) {
  if (percentage >= 95) {
    return {
      performanceStatus: "Outstanding",
      performanceScore: 5,
    };
  }

  if (percentage >= 85) {
    return {
      performanceStatus: "Excellent",
      performanceScore: 4,
    };
  }

  if (percentage >= 70) {
    return {
      performanceStatus: "Good",
      performanceScore: 3,
    };
  }

  if (percentage >= 50) {
    return {
      performanceStatus: "Average",
      performanceScore: 2,
    };
  }

  return {
    performanceStatus: "Needs Improvement",
    performanceScore: 1,
  };
};