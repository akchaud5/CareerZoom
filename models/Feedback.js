const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ai', 'peer', 'self'],
    required: true
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  contentFeedback: {
    clarity: {
      score: Number,
      comments: String
    },
    relevance: {
      score: Number,
      comments: String
    },
    depth: {
      score: Number,
      comments: String
    },
    structure: {
      score: Number,
      comments: String
    }
  },
  deliveryFeedback: {
    confidence: {
      score: Number,
      comments: String
    },
    pacing: {
      score: Number,
      comments: String
    },
    articulation: {
      score: Number,
      comments: String
    },
    bodyLanguage: {
      score: Number,
      comments: String
    }
  },
  technicalFeedback: {
    accuracy: {
      score: Number,
      comments: String
    },
    problemSolving: {
      score: Number,
      comments: String
    },
    domainKnowledge: {
      score: Number,
      comments: String
    }
  },
  strengths: [String],
  improvements: [String],
  generalComments: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
