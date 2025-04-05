const Feedback = require('../../models/Feedback');
const Interview = require('../../models/Interview');
const ImprovementPlan = require('../../models/ImprovementPlan');
const aiService = require('../services/aiService');

// @desc    Save feedback for an interview
// @route   POST /api/interviews/:id/feedback
// @access  Private
exports.saveFeedback = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { type, overallRating, contentFeedback, deliveryFeedback, technicalFeedback, strengths, improvements, generalComments } = req.body;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if user is authorized to provide feedback
    const isOwner = interview.user.toString() === req.user._id.toString();
    const isPeerReviewer = interview.peerReviewers.some(
      reviewer => reviewer.toString() === req.user._id.toString()
    );

    if (!isOwner && !isPeerReviewer && type !== 'ai') {
      return res.status(403).json({ message: 'Not authorized to provide feedback' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      interview: interviewId,
      user: req.user._id,
      type,
      overallRating,
      contentFeedback,
      deliveryFeedback,
      technicalFeedback,
      strengths,
      improvements,
      generalComments
    });

    // Add feedback to interview
    interview.feedback.push(feedback._id);
    await interview.save();

    // If this is AI or peer feedback, update the improvement plan
    if ((type === 'ai' || type === 'peer') && isOwner) {
      await updateImprovementPlan(req.user._id, feedback);
    }

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all feedback for an interview
// @route   GET /api/interviews/:id/feedback
// @access  Private
exports.getInterviewFeedback = async (req, res) => {
  try {
    const interviewId = req.params.id;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if user is authorized to view feedback
    const isOwner = interview.user.toString() === req.user._id.toString();
    const isPeerReviewer = interview.peerReviewers.some(
      reviewer => reviewer.toString() === req.user._id.toString()
    );

    if (!isOwner && !isPeerReviewer) {
      return res.status(403).json({ message: 'Not authorized to view feedback' });
    }

    // Get all feedback for this interview
    const feedback = await Feedback.find({ interview: interviewId })
      .populate('user', 'firstName lastName email')
      .sort('-createdAt');

    res.json(feedback);
  } catch (error) {
    console.error('Get interview feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get improvement plan for an interview/user
// @route   GET /api/interviews/:id/improvement-plan
// @access  Private
exports.getImprovementPlan = async (req, res) => {
  try {
    console.log(`Fetching improvement plan for interview ${req.params.id}`);
    const interviewId = req.params.id;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if user is authorized to view the improvement plan
    // For development, allow access even without proper authentication
    const isDevEnvironment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (!isDevEnvironment && interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this improvement plan' });
    }

    // Set the user ID to match the interview owner for development
if (isDevEnvironment && (!req.user || req.user._id !== interview.user.toString())) {
  console.log('Development mode: Setting user to match interview owner');
  req.user = { _id: interview.user.toString() };
}
console.log(`Authorized to view improvement plan for user ${req.user._id}`);

    // Get user with populated improvement plan
    const User = require('../../models/User');
    const user = await User.findById(req.user._id).populate('improvementPlan');

    // If no improvement plan exists yet, create one based on feedback
    if (!user.improvementPlan) {
      console.log('No improvement plan found, creating a new one');
      
      // Get feedback for this interview
      const feedback = await Feedback.find({ interview: interviewId });
      
      if (feedback.length > 0) {
        // Use the first feedback to generate an improvement plan
        const improvementPlan = await updateImprovementPlan(req.user._id, feedback[0]);
        
        // Convert to format expected by client
        const formattedPlan = formatImprovementPlan(improvementPlan, interview);
        return res.json(formattedPlan);
      } else {
        // No feedback available yet, but don't return 404 error
        // Instead, return a partial plan with instructions
        console.log('No feedback found for interview, returning empty plan template');
        
        // Create a starter improvement plan with instructions
        const starterPlan = {
          id: 'starter-plan',
          interviewId: interviewId,
          userId: req.user._id,
          createdAt: new Date().toISOString(),
          summary: 'This interview does not have feedback yet. To generate a personalized improvement plan, you need to either get AI feedback or peer feedback on your interview performance.',
          strengthAreas: [],
          improvementAreas: [],
          focusAreas: [
            {
              title: 'Complete Your Interview',
              description: 'To get a personalized improvement plan, you need to complete your interview and receive feedback.',
              recommendations: [
                'Start the interview by clicking "Start Now" from the dashboard',
                'Answer all the interview questions',
                'After completing the interview, wait for AI feedback or invite peers to review'
              ],
              resources: [
                { title: 'How to Get the Most from Mock Interviews', type: 'Guide' },
                { title: 'Interview Preparation Best Practices', type: 'Article' }
              ]
            }
          ],
          nextSteps: [
            'Start your scheduled interview',
            'Complete all interview questions',
            'Request feedback from peers or use AI analysis'
          ]
        };
        
        return res.json(starterPlan);
      }
    }
    
    // Format the improvement plan for the client
    const formattedPlan = formatImprovementPlan(user.improvementPlan, interview);
    res.json(formattedPlan);
  } catch (error) {
    console.error('Get improvement plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update improvement plan based on feedback
// Exported for direct use in other modules
exports.updateImprovementPlan = async function(userId, feedback) {
  try {
    // Get user's improvement plan or create one if it doesn't exist
    let improvementPlan = await ImprovementPlan.findOne({ user: userId });
    
    if (!improvementPlan) {
      improvementPlan = await ImprovementPlan.create({
        user: userId,
        goals: [],
        recommendations: [],
        progress: {
          latestInterviewScore: 0,
          improvementPercentage: 0,
          consistentWeakAreas: [],
          consistentStrengthAreas: []
        }
      });

      // Update user with improvement plan reference
      const User = require('../../models/User');
      await User.findByIdAndUpdate(userId, { improvementPlan: improvementPlan._id });
    }

    // Calculate overall score from feedback
    const contentScores = Object.values(feedback.contentFeedback || {}).map(f => f.score).filter(Boolean);
    const deliveryScores = Object.values(feedback.deliveryFeedback || {}).map(f => f.score).filter(Boolean);
    const technicalScores = Object.values(feedback.technicalFeedback || {}).map(f => f.score).filter(Boolean);
    
    const allScores = [...contentScores, ...deliveryScores, ...technicalScores].filter(Boolean);
    const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    
    // Update improvement plan with latest score
    const previousScore = improvementPlan.progress.latestInterviewScore || 0;
    improvementPlan.progress.latestInterviewScore = averageScore;
    
    // Calculate improvement percentage if there was a previous score
    if (previousScore > 0) {
      const improvement = ((averageScore - previousScore) / previousScore) * 100;
      improvementPlan.progress.improvementPercentage = Math.round(improvement * 100) / 100;
    }

    // Identify weak areas and strengths
    const weakAreas = [];
    const strengthAreas = [];

    // Check content feedback
    if (feedback.contentFeedback) {
      Object.entries(feedback.contentFeedback).forEach(([area, data]) => {
        if (data.score && data.score < 3) weakAreas.push(`content_${area}`);
        if (data.score && data.score >= 4) strengthAreas.push(`content_${area}`);
      });
    }

    // Check delivery feedback
    if (feedback.deliveryFeedback) {
      Object.entries(feedback.deliveryFeedback).forEach(([area, data]) => {
        if (data.score && data.score < 3) weakAreas.push(`delivery_${area}`);
        if (data.score && data.score >= 4) strengthAreas.push(`delivery_${area}`);
      });
    }

    // Check technical feedback
    if (feedback.technicalFeedback) {
      Object.entries(feedback.technicalFeedback).forEach(([area, data]) => {
        if (data.score && data.score < 3) weakAreas.push(`technical_${area}`);
        if (data.score && data.score >= 4) strengthAreas.push(`technical_${area}`);
      });
    }

    // Update consistent weak areas and strengths
    const currentWeakAreas = improvementPlan.progress.consistentWeakAreas || [];
    const currentStrengthAreas = improvementPlan.progress.consistentStrengthAreas || [];
    
    improvementPlan.progress.consistentWeakAreas = [...new Set([...currentWeakAreas, ...weakAreas])];
    improvementPlan.progress.consistentStrengthAreas = [...new Set([...currentStrengthAreas, ...strengthAreas])];

    // Generate recommendations based on weak areas if AI feedback
    if (feedback.type === 'ai' && weakAreas.length > 0) {
      const recommendations = await aiService.generateRecommendations(weakAreas);
      
      if (recommendations && recommendations.length > 0) {
        // Add new recommendations
        improvementPlan.recommendations = [
          ...improvementPlan.recommendations,
          ...recommendations
        ];
      }
    }

    // Save updated improvement plan
    await improvementPlan.save();
    
    return improvementPlan;
  } catch (error) {
    console.error('Update improvement plan error:', error);
    throw error;
  }
}

// Helper function to format improvement plan for client
function formatImprovementPlan(improvementPlan, interview) {
  // Create focus areas from recommendations
  const focusAreas = improvementPlan.recommendations.map(rec => {
    return {
      title: rec.area.charAt(0).toUpperCase() + rec.area.slice(1),
      description: rec.description,
      recommendations: rec.resources.map(r => r.title),
      resources: rec.resources.map(r => ({
        title: r.title,
        type: r.type.charAt(0).toUpperCase() + r.type.slice(1)
      }))
    };
  });

  // Extract strength and improvement areas
  const strengthAreas = improvementPlan.progress.consistentStrengthAreas.map(area => {
    const [category, specific] = area.split('_');
    return specific.charAt(0).toUpperCase() + specific.slice(1);
  });

  const improvementAreas = improvementPlan.progress.consistentWeakAreas.map(area => {
    const [category, specific] = area.split('_');
    return specific.charAt(0).toUpperCase() + specific.slice(1);
  });

  // Create next steps from goals
  const nextSteps = improvementPlan.goals.map(goal => {
    return `${goal.description} (${goal.priority} priority)`;
  });

  // Add default next steps if none exist
  if (nextSteps.length === 0) {
    nextSteps.push(
      'Schedule another practice interview',
      'Review feedback from your previous interviews',
      'Focus on your highest priority improvement areas'
    );
  }

  // Generate a summary based on the data
  const summary = `Based on your interview performance, you've shown strengths in ${strengthAreas.length > 0 ? strengthAreas.join(', ') : 'several areas'} 
    but could benefit from improvement in ${improvementAreas.length > 0 ? improvementAreas.join(', ') : 'certain aspects'}. 
    Your overall performance score is ${improvementPlan.progress.latestInterviewScore.toFixed(1)}/5. 
    Focus on the recommended areas below to enhance your interview skills.`;

  return {
    id: improvementPlan._id,
    interviewId: interview._id,
    userId: improvementPlan.user,
    createdAt: improvementPlan.createdAt,
    summary,
    strengthAreas,
    improvementAreas,
    focusAreas,
    nextSteps
  };
}

// Helper function to create mock improvement plan when no real data exists
function createMockImprovementPlan(interviewId, userId) {
  return {
    id: 'mock-improvement-plan',
    interviewId,
    userId,
    createdAt: new Date().toISOString(),
    summary: 'This is a sample improvement plan. Complete an interview with AI or peer feedback to generate a personalized plan based on your performance.',
    strengthAreas: [
      'Technical knowledge',
      'Enthusiasm',
      'Industry knowledge'
    ],
    improvementAreas: [
      'Communication clarity',
      'Structured responses',
      'Concise answers'
    ],
    focusAreas: [
      {
        title: 'Structured Interview Responses',
        description: 'Practice structuring your answers with a clear beginning, middle, and end.',
        recommendations: [
          'Practice the STAR method (Situation, Task, Action, Result) for behavioral questions',
          'Prepare 5-7 stories that can be adapted to different questions',
          'Record yourself answering mock questions and review for structure'
        ],
        resources: [
          { title: 'The STAR Interview Method Guide', type: 'Article' },
          { title: 'Structured Interview Response Workshop', type: 'Video' }
        ]
      },
      {
        title: 'Technical Communication',
        description: 'Focus on explaining technical concepts clearly and concisely.',
        recommendations: [
          'Practice explaining technical concepts to non-technical friends',
          'Use analogies for complex technical concepts',
          'Ask if your explanation makes sense before continuing'
        ],
        resources: [
          { title: 'Explaining Technical Concepts Clearly', type: 'Book' },
          { title: 'Communication for Engineers', type: 'Online Course' }
        ]
      }
    ],
    nextSteps: [
      'Schedule another practice interview',
      'Complete a mock interview with AI feedback',
      'Review the recommended resources above'
    ]
  };
}
