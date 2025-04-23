const Student = require('../models/Students');
const Campus = require('../models/Campus');

// Create Student
exports.createStudent = async function (req, res) {
  try {
    // Verify campus exists
    const campus = await Campus.findById(req.body.campus);
    if (!campus) {
      return res.status(400).json({
        status: "error",
        message: "Invalid campus ID"
      });
    }

    const data = await Student.create(req.body);
    res.status(201).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get All Students with Pagination
exports.getAllStudents = async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find()
        .populate('campus', 'name type location') // Populate campus details
        .skip(skip)
        .limit(limit),
      Student.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: students,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.getStudentByRegNumber = async (req, res) => {
  try {
    const student = await Student.findOne({ regNumber: req.params.regNumber });
    if (!student) {
      return res.status(404).json({ status: "error", message: "Student not found" });
    }
    res.status(200).json({ status: "success", data: student });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ status: "success", data: student });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
exports.checkRegNumber = async (req, res) => {
  try {
    const student = await Student.findOne({ regNumber: req.params.regNumber });
    res.status(200).json({ exists: !!student });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ status: "error", message: "Search query required" });
    }

    const students = await Student.find({
      $or: [
        { studentName: { $regex: query, $options: 'i' } },
        { regNumber: { $regex: `^${query}`, $options: 'i' } }
      ]
    }).populate('campus', 'name').limit(10);

    res.status(200).json({ status: "success", data: students });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// Get Students by Campus
exports.getStudentsByCampus = async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find({ campus: req.params.campusId })
        .populate('campus', 'name type location')
        .skip(skip)
        .limit(limit),
      Student.countDocuments({ campus: req.params.campusId })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: students,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};