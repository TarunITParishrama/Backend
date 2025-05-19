const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  dropDate: {
    type: Date,
    required: [true, 'Drop date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Drop date must be in the future'
    }
  },
  dropTime: {
    type: String,
    required: [true, 'Drop time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'expired'],
    default: 'scheduled'
  }
});

// Index for efficient querying
noticeSchema.index({ dropDate: 1, status: 1 });

// Pre-save hook to update status
noticeSchema.pre('save', function(next) {
  const now = new Date();
  const dropDateTime = new Date(this.dropDate);
  const [hours, minutes] = this.dropTime.split(':');
  dropDateTime.setHours(hours, minutes, 0, 0);

  if (dropDateTime <= now) {
    this.status = 'active';
  }
  next();
});

module.exports = mongoose.model('Notice', noticeSchema);