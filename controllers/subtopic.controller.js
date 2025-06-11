const express = require("express")
const Subtopic = require("../models/Subtopic")
const Chapter = require("../models/Chapters");
const Subject = require("../models/Subjects");
const mongoose =  require("mongoose")

exports.createSubtopic = async function (req, res) {
    try {
        const { subtopicName, subject, chapter } = req.body;

        if (!subtopicName || !subject || !chapter) {
            return res.status(400).json({
                status: "error",
                message: "subtopicName, subject, and chapter are required",
            });
        }

        // Find Subject by Name
        const subjectData = await Subject.findOne({ subjectName: subject });
        if (!subjectData) {
            return res.status(400).json({
                status: "error",
                message: `Subject '${subject}' not found`,
            });
        }

        // Find Chapter by Name & Subject
        const chapterData = await Chapter.findOne({ chapterName: chapter, subject: subjectData._id });
        if (!chapterData) {
            return res.status(400).json({
                status: "error",
                message: `Chapter '${chapter}' not found under Subject '${subject}'`,
            });
        }

        // Create Subtopic with ObjectIds
        const data = await Subtopic.create({
            subtopicName,
            subject: subjectData._id,
            chapter: chapterData._id,
        });

        res.status(201).json({
            status: "success",
            data,
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

exports.getSubtopics = async function (req, res) {
    try {
        const { subject, chapter } = req.query;
        let filter = {};

        if (subject) {
            const subjectData = await Subject.findOne({ subjectName: subject });
            if (!subjectData) {
                return res.status(400).json({
                    status: "error",
                    message: `Subject '${subject}' not found`,
                });
            }
            filter.subject = subjectData._id;
        }

        if (chapter) {
            const chapterData = await Chapter.findOne({ chapterName: chapter, ...filter });
            if (!chapterData) {
                return res.status(400).json({
                    status: "error",
                    message: `Chapter '${chapter}' not found under Subject '${subject}'`,
                });
            }
            filter.chapter = chapterData._id;
        }

        const data = await Subtopic.find(filter).populate("subject").populate("chapter");

        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
}

exports.getSubtopicById = async function (req,res) {
    try{
        const data = await Subtopic.findById(req.params.subtopicId).populate("subject").populate("chapter")
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

exports.updateSubtopicById = async function (req,res) {
    try{
        const data = await Subtopic.findByIdAndUpdate(req.params.subtopicId, req.body)
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

exports.deleteSubtopicById = async function (req,res) {
    try{
        const data = await Subtopic.findByIdAndDelete(req.params.subtopicId)
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