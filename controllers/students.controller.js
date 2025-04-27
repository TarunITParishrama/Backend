const Student = require('../models/Students');
const Campus = require('../models/Campus');
const { 
  generateUploadURL, 
  generateViewURL,
  fileExists
} = require('../utils/s3.js');
const path = require('path');

// Helper function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

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

    // Check if student exists
    const existingStudent = await Student.findOne({ regNumber: req.body.regNumber });
    
    if (existingStudent) {
      return res.status(400).json({
        status: "error",
        message: "Registration number already exists"
      });
    }

    // Create student
    const student = await Student.create({...req.body, studentImageURL : req.body.studentImageURL || null});
    
    res.status(201).json({
      status: "success",
      data: student
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.generateImageUploadURL = async (req, res) => {
  try {
    const { regNumber, fileExtension } = req.params;
    
    // No need to check if student exists - we allow uploads for new students
    const ext = fileExtension || '.jpg';
    const uploadURL = await generateUploadURL(regNumber, ext);
    const viewURL = await generateViewURL(regNumber, ext);
    
    res.status(200).json({ 
      status: "success", 
      uploadURL,
      viewURL
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};


// Get All Students with fresh image URLs
exports.getAllStudents = async function (req, res) {
  try {
    const students = await Student.find().populate('campus');

    const studentsWithUrls = await Promise.all(students.map(async student => {
      const studentObj = student.toObject();

      if (student.regNumber) {
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        for (const ext of extensions) {
          try {
            const url = await generateViewURL(student.regNumber, ext);
            studentObj.studentImageURL = url;
            break;
          } catch (err) {
            continue;
          }
        }
      }

      return studentObj;
    }));

    res.status(200).json({ status: "success", data: studentsWithUrls });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get single Student by RegNumber with fresh image URL
exports.getStudentByRegNumber = async (req, res) => {
  try {
    const student = await Student.findOne({ regNumber: req.params.regNumber });
    if (!student) {
      return res.status(404).json({ status: "error", message: "Student not found" });
    }

    const studentObj = student.toObject();

    if (student.regNumber) {
      const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
      for (const ext of extensions) {
        const exists = await fileExists(student.regNumber, ext);
        if (exists) {
          const url = await generateViewURL(student.regNumber, ext);
          studentObj.studentImageURL = url;
          break;
        }
      }
    }

    res.status(200).json({ status: "success", data: studentObj });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// Update a student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ status: "error", message: "Student not found" });
    }

    res.status(200).json({ status: "success", data: student });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ status: "error", message: "Student not found" });
    }

    // Attempt to delete associated image in S3
    if (student.regNumber) {
      const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
      for (const ext of extensions) {
        try {
          await deleteFile(student.regNumber, ext);
          break; // Delete first matching file
        } catch (err) {
          continue; // Try next extension
        }
      }
    }

    // Delete student from DB
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