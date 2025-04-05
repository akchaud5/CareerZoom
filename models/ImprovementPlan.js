const mongoose = require('mongoose');

const ImprovementPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goals: [{
    area: {
      type: String,
      enum: ['content', 'delivery', 'technical', 'communication', 'problem-solving'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    deadline: Date
  }],
  recommendations: [{
    area: String,
    description: String,
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'course', 'book', 'practice']
      }
    }]
  }],
  progress: {
    latestInterviewScore: Number,
    improvementPercentage: Number,
    consistentWeakAreas: [String],
    consistentStrengthAreas: [String]
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

module.exports = mongoose.model('ImprovementPlan', ImprovementPlanSchema);
