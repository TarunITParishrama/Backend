exports.getRemarks = function (percentile) {
  if (percentile < 50) {
    return "Needs foundational revision";
  }

  if (percentile < 75) {
    return "May secure BDS / AYUSH / Pvt Mgmt seat";
  }

  if (percentile < 90) {
    return "Pvt MBBS / Reserved Govt possibility";
  }

  return "High performance zone - Strong Govt MBBS chance";
};