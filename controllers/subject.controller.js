const express = require('express')
const mongoose = require('mongoose')
const Subject = require('../models/Subjects')

// Create
 exports.createSubject = async function (req,res) {
   try{
    const data = await Subject.create(req.body)
    res.status(201).json({
        status:"success",
        data
    })
   }catch(err){
    res.status(404).json({
        status:"error",
        message:err.message
    })
   }
}

// Enhanced getSubject controller
exports.getSubjects = async function (req, res) {
  try {
    const mongoose = require('mongoose');
    let query = {};
    
    if (req.query.ids) {
      const ids = req.query.ids.split(',')
        .map(id => id.trim())
        .filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (ids.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No valid subject IDs provided"
        });
      }
      
      query = { _id: { $in: ids } };
    }

    const data = await Subject.find(query);
    res.status(200).json({
      status: "success",
      data
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
}
 // Read Subject
exports.getSubjectById = async function (req,res) {
    try{
     const data = await Subject.findById(req.params.subjectId)
     res.status(200).json({
         status:"success",
         data
     })
    }catch(err){
     res.status(404).json({
         status:"error",
         message:err.message
     })
    }
 }
//  Edit
 exports.updatSubjectById = async function (req,res) {
    try{
     const data = await Subject.findByIdAndUpdate(req.params.subjectId,req.body)
     res.status(201).json({
         status:"success",
         data
     })
    }catch(err){
     res.status(404).json({
         status:"error",
         message:err.message
     })
    }
 }
 exports.deletesubjectById = async function (req,res) {
    try{
     const data = await Subject.findByIdAndDelete(req.params.subjectId)
     res.status(201).json({
         status:"success",
     })
    }catch(err){
     res.status(404).json({
         status:"error",
         message:err.message
     })
    }
 }