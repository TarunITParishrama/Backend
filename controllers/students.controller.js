const Student = require("../models/Students");
const Campus = require("../models/Campus");
const DeletedStudent = require("../models/DeletedStudent.js");
const {
  generateUploadURL,
  generateViewURL,
  fileExists,
  deleteFile,
} = require("../utils/s3.js");
const path = require("path");
const exceljs = require("exceljs");

// Helper function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Create Student
exports.createStudent = async function (req, res) {
  try {
    // Verify campus exists
    const campus = await Campus.findById(req.body.campus);
    if (!campus) {
      return res.status(400).json({
        status: "error",
        message: "Invalid campus ID",
      });
    }

    // Parse dateOfBirth
    if (req.body.dateOfBirth) {
      req.body.dateOfBirth = parseDateOfBirth(req.body.dateOfBirth);
      if (!req.body.dateOfBirth || isNaN(req.body.dateOfBirth.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date of birth format. Use DD-MM-YYYY",
        });
      }
    }

    // Check if student exists
    const existingStudent = await Student.findOne({
      regNumber: req.body.regNumber,
    });

    if (existingStudent) {
      return res.status(400).json({
        status: "error",
        message: "Registration number already exists",
      });
    }

    // Create student
    const student = await Student.create({
      ...req.body,
      studentImageURL: req.body.studentImageURL || null,
      dateOfBirth: req.body.dateOfBirth,
    });

    res.status(201).json({
      status: "success",
      data: student,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};
//bulk students details upload without Image
exports.bulkCreateStudents = async (req, res) => {
  try {
    const studentsData = req.body.students;

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "No students data provided" });
    }

    let successCount = 0;
    const failedStudents = [];
    const createdStudents = []; // For debugging

    for (const studentData of studentsData) {
      try {
        // Check if regNumber already exists
        const existingStudent = await Student.findOne({
          regNumber: studentData.regNumber,
        });
        if (existingStudent) {
          failedStudents.push({
            regNumber: studentData.regNumber,
            reason: "Registration number already exists",
          });
          continue;
        }

        // Parse dateOfBirth if exists
        let parsedDate = null;
        if (studentData.dateOfBirth) {
          try {
            parsedDate = parseDateOfBirth(studentData.dateOfBirth);
            if (!parsedDate || isNaN(parsedDate.getTime())) {
              throw new Error("Invalid date format");
            }
            studentData.dateOfBirth = parsedDate;
          } catch (dateError) {
            failedStudents.push({
              regNumber: studentData.regNumber,
              reason: `Invalid date format: ${studentData.dateOfBirth}. Use DD-MM-YYYY`,
            });
            continue;
          }
        }

        // Create new student
        const newStudent = await Student.create(studentData);
        createdStudents.push(newStudent); // For debugging
        successCount++;
      } catch (err) {
        console.error(`Error creating student ${studentData.regNumber}:`, err);
        failedStudents.push({
          regNumber: studentData.regNumber || "Unknown",
          reason: err.message || "Validation error",
          details: err.errors
            ? Object.values(err.errors).map((e) => e.message)
            : [],
        });
      }
    }

    // Log results for debugging
    console.log(
      `Bulk create results - Success: ${successCount}, Failed: ${failedStudents.length}`
    );
    console.log(
      "Created students:",
      createdStudents.map((s) => s.regNumber)
    );
    console.log("Failed students:", failedStudents);

    res.status(200).json({
      status: "success",
      successCount,
      failedCount: failedStudents.length,
      failedStudents,
      createdStudents: createdStudents.map((s) => s.regNumber), // For debugging
    });
  } catch (err) {
    console.error("Bulk create error:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Helper function to parse date
function parseDateOfBirth(dateString) {
  if (!dateString) return null;

  // Handle various date formats
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    // DD-MM-YYYY
    const [day, month, year] = dateString.split("-");
    return new Date(Date.UTC(year, month - 1, day));
  } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD
    const [year, month, day] = dateString.split("-");
    return new Date(Date.UTC(year, month - 1, day));
  } else if (dateString instanceof Date) {
    return dateString;
  }
  throw new Error("Unsupported date format");
}

exports.generateImageUploadURL = async (req, res) => {
  try {
    const { regNumber, fileExtension } = req.params;

    // No need to check if student exists - we allow uploads for new students
    const ext = fileExtension || ".jpg";
    const uploadURL = await generateUploadURL(regNumber, ext);
    const viewURL = await generateViewURL(regNumber, ext);

    res.status(200).json({
      status: "success",
      uploadURL,
      viewURL,
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// Get All Students with fresh image URLs
exports.getAllStudents = async function (req, res) {
  try {
    //     const page = parseInt(req.query.page) || 1;
    //     const limit = parseInt(req.query.limit) || 100;
    //     const skip = (page - 1) * limit;
    //     const total = await Student.countDocuments();

    const students = await Student.find().populate("campus");
    // .skip(skip)
    // .limit(limit);

    const studentsWithUrls = await Promise.all(
      students.map(async (student) => {
        const studentObj = student.toObject();

        if (student.regNumber) {
          const extensions = [".jpg", ".jpeg", ".png", ".webp"];
          for (const ext of extensions) {
            try {
              const exists = await fileExists(student.regNumber, ext);
              if (exists) {
                const url = await generateViewURL(student.regNumber, ext);
                studentObj.studentImageURL = url;
                break;
              }
            } catch (err) {
              continue;
            }
          }
        }

        // Format dateOfBirth for display
        if (studentObj.dateOfBirth) {
          const dob = new Date(studentObj.dateOfBirth);
          studentObj.formattedDOB = `${dob
            .getDate()
            .toString()
            .padStart(2, "0")}-${(dob.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${dob.getFullYear()}`;
        }

        return studentObj;
      })
    );

    res.status(200).json({
      status: "success",
      //  total, page, totalPages: Math.ceil(total / limit),
      data: studentsWithUrls,
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get single Student by RegNumber with fresh image URL
exports.getStudentByRegNumber = async (req, res) => {
  try {
    const student = await Student.findOne({
      regNumber: req.params.regNumber,
    }).populate("campus");
    if (!student) {
      return res
        .status(404)
        .json({ status: "error", message: "Student not found" });
    }

    const studentObj = student.toObject();

    if (student.regNumber) {
      const extensions = [".jpg", ".jpeg", ".png", ".webp"];
      for (const ext of extensions) {
        const exists = await fileExists(student.regNumber, ext);
        if (exists) {
          const url = await generateViewURL(student.regNumber, ext);
          studentObj.studentImageURL = url;
          break;
        }
      }
    }

    // Format dateOfBirth for display
    if (studentObj.dateOfBirth) {
      const dob = new Date(studentObj.dateOfBirth);
      studentObj.formattedDOB = `${dob
        .getDate()
        .toString()
        .padStart(2, "0")}-${(dob.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dob.getFullYear()}`;
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
    // Parse dateOfBirth if provided
    if (req.body.dateOfBirth) {
      req.body.dateOfBirth = parseDateOfBirth(req.body.dateOfBirth);
      if (!req.body.dateOfBirth || isNaN(req.body.dateOfBirth.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date of birth format. Use DD-MM-YYYY",
        });
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res
        .status(404)
        .json({ status: "error", message: "Student not found" });
    }

    // Format dateOfBirth for response
    const studentObj = student.toObject();
    if (studentObj.dateOfBirth) {
      const dob = new Date(studentObj.dateOfBirth);
      studentObj.formattedDOB = `${dob
        .getDate()
        .toString()
        .padStart(2, "0")}-${(dob.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dob.getFullYear()}`;
    }

    res.status(200).json({ status: "success", data: studentObj });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ status: "error", message: "Student not found" });
    }

    // Attempt to delete associated image in S3
    if (student.regNumber) {
      const extensions = [".jpg", ".jpeg", ".png", ".webp"];
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

exports.deleteStudentImage = async (req, res) => {
  try {
    const { regNumber } = req.params;

    if (!regNumber) {
      return res.status(400).json({
        status: "error",
        message: "Registration number required",
      });
    }

    const extensions = [".jpg", ".jpeg", ".png", ".webp"];
    let deleted = false;

    for (const ext of extensions) {
      try {
        const exists = await fileExists(regNumber, ext);
        if (exists) {
          await deleteFile(regNumber, ext);
          deleted = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "No image found for this student",
      });
    }

    // Update student record in database
    await Student.findOneAndUpdate(
      { regNumber },
      { $unset: { studentImageURL: 1 } },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Reason for deletion is required." });
    }

    const student = await Student.findById(req.params.id).populate("campus");
    if (!student) {
      return res
        .status(404)
        .json({ status: "error", message: "Student not found" });
    }

    // Attempt to delete associated image in S3 (keep same behavior)
    if (student.regNumber) {
      const extensions = [".jpg", ".jpeg", ".png", ".webp"];
      for (const ext of extensions) {
        try {
          await deleteFile(student.regNumber, ext);
          break; // delete first matching file
        } catch (err) {
          continue; // try next extension
        }
      }
    }

    // Archive snapshot before deletion
    const archiveDoc = {
      originalId: student._id,
      admissionYear: student.admissionYear,
      campus: student.campus, // ObjectId
      gender: student.gender,
      admissionType: student.admissionType,
      regNumber: student.regNumber,
      dateOfBirth: student.dateOfBirth,
      studentName: student.studentName,
      studentImageURL: student.studentImageURL,
      allotmentType: student.allotmentType,
      section: student.section,
      fatherName: student.fatherName,
      fatherMobile: student.fatherMobile,
      emailId: student.emailId,
      address: student.address,
      contact: student.contact,
      medicalIssues: student.medicalIssues,
      medicalDetails: student.medicalDetails,
      reason: reason.trim(),
      deletedBy: req.user?._id, // if protect middleware attaches user
    };

    await DeletedStudent.create(archiveDoc);

    // Delete student from DB
    await Student.findByIdAndDelete(req.params.id);

    // 204 No Content - but include minimal JSON to be consistent with frontend expectations
    return res
      .status(200)
      .json({ status: "success", message: "Student deleted and archived." });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
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
      return res
        .status(400)
        .json({ status: "error", message: "Search query required" });
    }

    // Check if the query looks like a 10-digit mobile number
    const isMobileQuery = /^\d{10}$/.test(query);

    let searchConditions = [
      { studentName: { $regex: query, $options: "i" } },
      { regNumber: { $regex: `^${query}`, $options: "i" } },
    ];

    if (isMobileQuery) {
      // Search by fatherMobile or contact if it's a mobile number
      searchConditions.push({ fatherMobile: query });
      searchConditions.push({ contact: query });
    }

    const students = await Student.find({
      $or: searchConditions,
    })
      .populate("campus", "name")
      .limit(10);

    if (students.length === 0) {
      return res.status(200).json({
        status: "success",
        data: [],
        message: "No students found matching your search",
      });
    }

    res.status(200).json({ status: "success", data: students });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    // Create a new workbook
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Students Template");

    // Add headers
    worksheet.columns = [
      { header: "admissionYear", key: "admissionYear" },
      { header: "campus", key: "campus" },
      { header: "gender", key: "gender" },
      { header: "admissionType", key: "admissionType" },
      { header: "regNumber", key: "regNumber" },
      { header: "studentName", key: "studentName" },
      { header: "dateOfBirth", key: "dateOfBirth" },
      { header: "allotmentType", key: "allotmentType" },
      { header: "section", key: "section" },
      { header: "fatherName", key: "fatherName" },
      { header: "fatherMobile", key: "fatherMobile" },
      { header: "emailId", key: "emailId" },
      { header: "address", key: "address" },
      { header: "contact", key: "contact" },
      { header: "medicalIssues", key: "medicalIssues" },
      { header: "medicalDetails", key: "medicalDetails" },
    ];

    worksheet.addRow({
      admissionYear: "2023",
      campus: "Campus ID or Name",
      gender: "Boy/Girl",
      admissionType: "Residential/Semi-Residential/Non-Residential",
      regNumber: "123456 (6 digits)",
      studentName: "Student Full Name",
      dateOfBirth: "DD-MM-YYYY",
      allotmentType: "11th PUC/12th PUC/LongTerm",
      section: "PRB-A",
      fatherName: "Parent's Name",
      fatherMobile: "9876543210",
      emailId: "parent@example.com (optional)",
      address: "Full address",
      contact: "Alternate contact number",
      medicalIssues: "No/Yes",
      medicalDetails: "Details if medicalIssues is Yes",
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_template.xlsx"
    );

    // Send the workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate template",
    });
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
        .populate("campus", "name type location")
        .skip(skip)
        .limit(limit),
      Student.countDocuments({ campus: req.params.campusId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: students,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getDeletedStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      DeletedStudent.find({}, 'regNumber studentName campus studentImageURL deletedAt') // projection
        .populate('campus', 'name')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit),
      DeletedStudent.countDocuments(),
    ]);

    res.status(200).json({ status: 'success', total, page, totalPages: Math.ceil(total/limit), data });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getDeletedStudentById = async (req, res) => {
  try {
    const doc = await DeletedStudent.findById(req.params.id).populate('campus', 'name type location');
    if (!doc) return res.status(404).json({ status: 'error', message: 'Archived record not found' });
    res.status(200).json({ status: 'success', data: doc });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Get a single archived student by regNumber
exports.getDeletedStudentByReg = async (req, res) => {
  try {
    const doc = await DeletedStudent.findOne({ regNumber: req.params.regNumber }).populate('campus', 'name type');
    if (!doc) return res.status(404).json({ status: 'error', message: 'Archived record not found' });
    res.status(200).json({ status: 'success', data: doc });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
