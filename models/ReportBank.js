const mongoose = require('mongoose');

const ReportBankSchema = new mongoose.Schema({
    reportRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    date: { type: Date, required: true },
    regNumber: { type: String, required: true },
    questionAnswer: { type: Map, of: String, required: true }, 
});

ReportBankSchema.index({ regNumber: 1 });
ReportBankSchema.index({ regNumber: 1, date: 1 });
ReportBankSchema.index({ regNumber: 1, questionAnswer: 1 });

module.exports = mongoose.model('ReportBank', ReportBankSchema);
