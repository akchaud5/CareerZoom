const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  interviewDate: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  zoomMeetingId: {
    type: String
  },
  zoomStartUrl: {
    type: String
  },
  zoomJoinUrl: {
    type: String
  },
  recordingUrl: {
    type: String
  },
  transcript: {
    type: String,
    trim: true
  },
  transcriptCompleted: {
    type: Boolean,
    default: false
  },
  useVoiceOver: {
    type: Boolean,
    default: false
  },
  voiceType: {
    type: String,
    enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    default: 'alloy'
  },
  peerReviewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  feedback: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  analysisResults: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', InterviewSchema);