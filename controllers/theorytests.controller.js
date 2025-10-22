const TheoryTest = require("../models/TheoryTest");
const Subject = require("../models/Subjects");
const Student = require("../models/Students");

// Create a new theory test
exports.createTheoryTest = async (req, res) => {
  try {
    // Validate subject details with Subject model
    const subjects = await Subject.find();
    const subjectNames = subjects.map((sub) => 
      sub.subjectName ? sub.subjectName.toLowerCase() : ''
    ).filter(name => name); // Remove empty names

    for (const subDetail of req.body.subjectDetails) {
      if (!subDetail.name) {
        return res.status(400).json({
          status: "error",
          message: `Subject name is required`,
        });
      }

      const subjectName = subDetail.name.toLowerCase();
      if (!subjectNames.includes(subjectName)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid subject: ${subDetail.name}`,
        });
      }
    }

    const theoryTest = await TheoryTest.create(req.body);
    res.status(201).json({
      status: "success",
      data: theoryTest,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get all theory tests
exports.getAllTheoryTests = async (req, res) => {
  try {
    const tests = await TheoryTest.find();
    res.status(200).json({
      status: "success",
      data: tests,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get theory tests by stream
exports.getTheoryTestsByStream = async (req, res) => {
  try {
    const tests = await TheoryTest.find({ stream: req.params.stream });
    res.status(200).json({
      status: "success",
      data: tests,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get student's theory test results by regNumber
exports.getStudentTheoryResults = async (req, res) => {
  try {
    const tests = await TheoryTest.find({
      "studentResults.regNumber": req.params.regNumber,
    });

    res.status(200).json({
      status: "success",
      data: tests,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get specific theory test by ID
exports.getTheoryTestById = async (req, res) => {
  try {
    const test = await TheoryTest.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({
        status: "error",
        message: "Test not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: test,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// GET theory tests for a campus (+optional section)
exports.getTheoryTestsByCampusSection = async (req, res) => {
  try {
    const { campus, section } = req.query;
    if (!campus) {
      return res.status(400).json({ status: "error", message: "campus is required" });
    }

    // Find students by campus (and section if provided)
    const students = await Student.find({}).populate("campus");
    let matching = students.filter((s) => s.campus?.name === campus);
    if (section) matching = matching.filter((s) => (s.section || "").trim() === section.trim());

    const regSet = new Set(matching.map((s) => s.regNumber));
    if (!regSet.size) {
      return res.status(200).json({ status: "success", count: 0, data: [] });
    }

    // Get theory tests that include any of these students
    const tests = await TheoryTest.find({
      "studentResults.regNumber": { $in: Array.from(regSet) },
    }).sort({ date: -1 });

    res.status(200).json({
      status: "success",
      count: tests.length,
      data: tests,
    });
  } catch (err) {
    console.error("getTheoryTestsByCampusSection error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// GET flattened theory rows by campus+section in DetailedReport-like shape
exports.getTheoryResultsByCampusSection = async (req, res) => {
  try {
    const { campus, section } = req.query;
    if (!campus) {
      return res.status(400).json({ status: "error", message: "campus is required" });
    }

    // Resolve students set
    const students = await Student.find({}).populate("campus");
    let matching = students.filter((s) => s.campus?.name === campus);
    if (section) matching = matching.filter((s) => (s.section || "").trim() === section.trim());
    const byReg = new Map(matching.map((s) => [s.regNumber, s]));
    if (!byReg.size) {
      return res.status(200).json({ status: "success", count: 0, data: [] });
    }

    // Pull only tests that have these students
    const tests = await TheoryTest.find({
      "studentResults.regNumber": { $in: Array.from(byReg.keys()) },
    }).sort({ date: -1 });

    // Flatten to per-student rows
    const rows = [];
    for (const test of tests) {
      const fullMarks = (test.subjectDetails || []).reduce(
        (sum, s) => sum + Number(s.maxMarks || 0),
        0
      );

      for (const sr of test.studentResults || []) {
        const sMeta = byReg.get(sr.regNumber);
        if (!sMeta) continue;

        const subjects = (sr.subjectMarks || []).map((m) => {
          const def = (test.subjectDetails || []).find((d) => d.name === m.name);
          return {
            name: m.name,
            scored: Number(m.marks || 0),
            max: Number(def?.maxMarks || 0),
          };
        });

        rows.push({
          regNumber: sr.regNumber,
          studentName: sMeta.studentName,
          campus: sMeta.campus?.name || sMeta.campus, // keep name for frontend match
          section: sMeta.section || "",
          stream: sMeta.stream || test.stream || "",
          testName: test.testName, // e.g., PTT-01 / IPTT-02
          date: test.date,
          subjects,
          overallTotalMarks:
            typeof sr.totalMarks === "number"
              ? sr.totalMarks
              : subjects.reduce((a, b) => a + Number(b.scored || 0), 0),
          fullMarks,
          percentage: Number(sr.percentage || 0),
          percentile: Number(sr.percentile || 0),
          rank: Number(sr.rank || 0),
          isPresent: sr.isPresent !== false,
          remarks: sr.remarks || undefined,
          type: "Theory",
        });
      }
    }

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("getTheoryResultsByCampusSection error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};
