const FeedbackForm = require("../models/FeedbackForm");
const Feedback = require("../models/Feedback");
const FeedbackData = require("../models/FeedbackData");
const Campus = require("../models/Campus");

// FeedbackForm CRUD operations

exports.createFeedbackForm = async (req, res) => {
  try {
    const { name, questions } = req.body;
    
    // Validate questions array
    if (!name || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one question is required"
      });
    }

    const feedbackForm = await FeedbackForm.create({
      name,
      questions,
    });

    // Add options to the response
    const responseData = {
      ...feedbackForm.toObject(),
      options: {
        A: "Excellent",
        B: "Good",
        C: "Average",
        D: "Poor"
      }
    };

    res.status(201).json({
      status: "success",
      data: responseData
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.getFeedbackForms = async (req, res) => {
  try {
    const feedbackForms = await FeedbackForm.find()
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json({
      status: "success",
      data: feedbackForms
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.updateFeedbackForm = async (req, res) => {
  try {
    const { name, questions } = req.body;
    
    if (!name || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one question is required"
      });
    }

    const feedbackForm = await FeedbackForm.findOneAndUpdate(
      { _id: req.params.id },
      { name, questions },
      { new: true, runValidators: true }
    );

    if (!feedbackForm) {
      return res.status(404).json({
        status: "error",
        message: "Feedback form not found"
      });
    }

    // Add options to the response
    const responseData = {
      ...feedbackForm.toObject(),
      options: {
        A: "Excellent",
        B: "Good",
        C: "Average",
        D: "Poor"
      }
    };

    res.status(200).json({
      status: "success",
      data: responseData
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.deleteFeedbackForm = async (req, res) => {
  try {
    const feedbackForm = await FeedbackForm.findOneAndDelete({
      _id: req.params.id,
    });

    if (!feedbackForm) {
      return res.status(404).json({
        status: "error",
        message: "Feedback form not found"
      });
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// controllers/feedback.controller.js
exports.createFeedback = async (req, res) => {
  try {
    const { name, date, questionNumbers, feedbackFormId, createdBy } = req.body;
    
    // Validate required fields
    if (!name || !date || !questionNumbers || !feedbackFormId) {
      return res.status(400).json({
        status: "error",
        message: "Name, date, question numbers and feedback form ID are required"
      });
    }

    // Verify feedback form exists
    const feedbackForm = await FeedbackForm.findById(feedbackFormId);
    if (!feedbackForm) {
      return res.status(404).json({
        status: "error",
        message: "Feedback form not found"
      });
    }

    // Filter questions
    const selectedQuestions = feedbackForm.questions.filter(question => 
      questionNumbers.includes(question.questionNumber)
    );

    if (selectedQuestions.length !== questionNumbers.length) {
      return res.status(400).json({
        status: "error",
        message: "Some question numbers are invalid"
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      name,
      feedbackForm: feedbackForm._id,
      date,
      questions: selectedQuestions,
      options: feedbackForm.options,
      createdBy: createdBy || req.user._id
    });

    res.status(201).json({
      status: "success",
      data: feedback
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Feedback for this date already exists"
      });
    }
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const { date, name } = req.query;
    let query = {};
    
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date format"
        });
      }
      
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const feedbacks = await Feedback.find(query)
      .populate('feedbackForm', 'name') // Populate the feedbackForm name
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: "success",
      data: feedbacks || []
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!feedback) {
      return res.status(404).json({
        status: "error",
        message: "Feedback not found"
      });
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// FeedbackData CRUD operations
exports.createFeedbackData = async (req, res) => {
  try {
    const { 
      name,
      date, 
      streamType, 
      campus, 
      section, 
      studentCount, 
      responseCount, // Use the responseCount from the request body
      questions 
    } = req.body;

    // Validate required fields
    if (!name || !date || !streamType || !studentCount || !questions || responseCount === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields"
      });
    }

    // Verify feedback form exists for this date
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    const feedbackForm = await Feedback.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!feedbackForm) {
      return res.status(404).json({
        status: "error",
        message: "No feedback form found for this date"
      });
    }

    // Calculate aggregates
    let optionACount = 0;
    let optionBCount = 0;
    let optionCCount = 0;
    let optionDCount = 0;
    let noResponseCount = 0;

    questions.forEach(question => {
      optionACount += question.countA;
      optionBCount += question.countB;
      optionCCount += question.countC;
      optionDCount += question.countD;
      noResponseCount += question.noResponse;
    });

    const feedbackData = await FeedbackData.create({
      name,
      date,
      streamType,
      campus: streamType === "LongTerm" ? campus : null,
      section: streamType === "PUC" ? section : null,
      studentCount,
      responseCount, // Use the responseCount directly from the request
      questions,
      optionACount,
      optionBCount,
      optionCCount,
      optionDCount,
      noResponseCount
    });

    res.status(201).json({
      status: "success",
      data: feedbackData
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.bulkCreateFeedbackData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Data must be a non-empty array"
      });
    }

    const results = [];
    
    for (const item of data) {
      try {
        const { name, date, questions, campus, campusCount } = item;
        
        // Get campus details
        const campusDoc = await Campus.findById(campus);
        if (!campusDoc) {
          results.push({
            status: "error",
            message: `Campus not found for ID: ${campus}`,
            data: null
          });
          continue;
        }

        // Get feedback for the date to validate questions
        const feedback = await Feedback.findOne({ date, createdBy: req.user._id });
        if (!feedback) {
          results.push({
            status: "error",
            message: `No feedback form found for date: ${date}`,
            data: null
          });
          continue;
        }

        // Validate questions against feedback form
        const feedbackQuestionNumbers = feedback.questions.map(q => q.questionNumber);
        const invalidQuestions = questions.filter(
          q => !feedbackQuestionNumbers.includes(q.questionNumber)
        );

        if (invalidQuestions.length > 0) {
          results.push({
            status: "error",
            message: `Invalid question numbers for date ${date}: ${invalidQuestions.map(q => q.questionNumber).join(", ")}`,
            data: null
          });
          continue;
        }

        // Calculate option counts
        const optionCounts = { A: 0, B: 0, C: 0, D: 0 };
        questions.forEach(q => {
          optionCounts[q.option]++;
        });

        // Create or update feedback data
        const feedbackData = await FeedbackData.findOneAndUpdate(
          { date, campus, createdBy: req.user._id },
          {
            $set: {
              questions,
              campusName: campusDoc.name,
              campusCount,
              createdBy: req.user._id
            },
            $inc: {
              optionACount: optionCounts.A,
              optionBCount: optionCounts.B,
              optionCCount: optionCounts.C,
              optionDCount: optionCounts.D
            }
          },
          { new: true, upsert: true, runValidators: true }
        );

        results.push({
          status: "success",
          message: "Feedback data created/updated successfully",
          data: feedbackData
        });
      } catch (err) {
        results.push({
          status: "error",
          message: err.message,
          data: null
        });
      }
    }

    res.status(201).json({
      status: "success",
      data: results
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.getFeedbackData = async (req, res) => {
  try {
    const { name, date, streamType, campus, section } = req.query;
    const query = {};

    if(name){
      query.name = name;
    }
    
    // Improved date handling
    if (date) {
      // Handle both ISO string and date object
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date format"
        });
      }
      
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Stream type filtering
    if (streamType) {
      query.streamType = streamType;
      
      if (streamType === 'LongTerm' && campus) {
        query.campus = campus;
      } else if (streamType === 'PUC' && section) {
        query.section = section;
      }
    }

    const feedbackData = await FeedbackData.find(query)
      .sort({ date: -1 })
      .lean(); // Convert to plain JS objects

    // Ensure consistent response format
    res.status(200).json({
      status: "success",
      data: feedbackData || [] // Always return array
    });
  } catch (err) {
    console.error('Error fetching feedback data:', err);
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.getAvailableFeedbackDates = async (req, res) => {
  try {
    const dates = await FeedbackData.distinct('date'); // Just get distinct date values

    // Optional: sort by latest first
    dates.sort((a, b) => new Date(b) - new Date(a));

    res.status(200).json({
      status: "success",
      data: dates
    });
  } catch (err) {
    console.error('Error fetching feedback dates:', err);
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.updateFeedbackData = async (req, res) => {
  try {
    const { name, questions, campusCount } = req.body;
    
    // Find existing feedback data
    const existingData = await FeedbackData.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });
    
    if (!existingData) {
      return res.status(404).json({
        status: "error",
        message: "Feedback data not found"
      });
    }

    // Calculate difference in option counts if questions are provided
    let optionCounts = {
      A: existingData.optionACount,
      B: existingData.optionBCount,
      C: existingData.optionCCount,
      D: existingData.optionDCount
    };

    if (questions) {
      // Reset counts to zero
      optionCounts = { A: 0, B: 0, C: 0, D: 0 };
      
      // Recalculate based on new questions
      questions.forEach(q => {
        optionCounts[q.option]++;
      });
    }

    // Update feedback data
    const updatedData = await FeedbackData.findByIdAndUpdate(
      req.params.id,
      {
        questions: questions || existingData.questions,
        optionACount: optionCounts.A,
        optionBCount: optionCounts.B,
        optionCCount: optionCounts.C,
        optionDCount: optionCounts.D,
        campusCount: campusCount || existingData.campusCount
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: updatedData
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

exports.deleteFeedbackData = async (req, res) => {
  try {
    const feedbackData = await FeedbackData.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!feedbackData) {
      return res.status(404).json({
        status: "error",
        message: "Feedback data not found"
      });
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};