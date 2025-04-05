// Debug script for CareerZoom
const axios = require('axios');
const mongoose = require('mongoose');

// Set up MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/careerzoom', {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import models
const Interview = require('./models/Interview');
const Feedback = require('./models/Feedback');
const User = require('./models/User');
const ImprovementPlan = require('./models/ImprovementPlan');
const feedbackController = require('./api/controllers/feedbackController');

// Test the improvement plan functionality
async function testImprovementPlan() {
  try {
    console.log('--- Testing improvement plan functionality ---');
    
    // Use a recent interview ID
    const interviews = await Interview.find().sort({ createdAt: -1 }).limit(1);
    
    if (interviews.length === 0) {
      console.log('No interviews found');
      return;
    }
    
    const interview = interviews[0];
    console.log('Using interview:', interview._id);
    console.log('Interview status:', interview.status);
    console.log('Interview user:', interview.user);
    console.log('Feedback count:', interview.feedback.length);
    
    // Skip authentication for testing purposes - we'll use the direct route
    console.log('Skipping auth for testing');
    
    // 1. First, create some test feedback if none exists
    if (interview.feedback.length === 0) {
      console.log('Creating test feedback for interview');
      
      // Create test feedback directly using the model
      const feedback = new Feedback({
        interview: interview._id,
        user: interview.user,
        type: 'ai', 
        overallRating: 4.2,
        contentFeedback: {
          relevance: { score: 4.4, feedback: 'Your answers were highly relevant to the questions asked.' },
          completeness: { score: 4.0, feedback: 'You provided thorough responses to most questions.' },
          structure: { score: 3.8, feedback: 'Your answers had a good structure but could be more organized.' }
        },
        deliveryFeedback: {
          confidence: { score: 4.5, feedback: 'You demonstrated good confidence throughout the interview.' },
          clarity: { score: 4.2, feedback: 'Your speaking was clear and well-articulated.' },
          pacing: { score: 3.9, feedback: 'Your speaking pace was generally appropriate.' },
          engagement: { score: 4.0, feedback: 'You maintained good engagement with the interviewer.' }
        },
        strengths: [
          'Confident presentation',
          'Technical knowledge',
          'Clear communication'
        ],
        improvements: [
          'More structured responses',
          'More concise answers',
          'Additional specific examples'
        ],
        generalComments: 'Overall, you demonstrated good interview skills with room for improvement in structure and conciseness.'
      });
      
      await feedback.save();
      
      // Add feedback to interview
      interview.feedback.push(feedback._id);
      await interview.save();
      
      console.log('Created feedback with ID:', feedback._id);
      
      // Use feedbackController to update improvement plan
      await feedbackController.updateImprovementPlan(interview.user, feedback);
      console.log('Updated improvement plan based on new feedback');
    }
    
    // 2. Call the improvement plan endpoint
    try {
      console.log('Calling improvement plan endpoint for interview:', interview._id);
      const response = await axios.get(
        `http://localhost:5000/api/interviews/${interview._id}/improvement-plan`
      );
      
      console.log('Improvement plan response:');
      console.log('- ID:', response.data.id);
      console.log('- User ID:', response.data.userId);
      console.log('- Starts with "starter-plan":', response.data.id && response.data.id.startsWith('starter-plan'));
      console.log('- Strength areas:', response.data.strengthAreas?.length || 0);
      console.log('- Improvement areas:', response.data.improvementAreas?.length || 0);
      console.log('- Focus areas:', response.data.focusAreas?.length || 0);
    } catch (error) {
      console.error('Improvement plan API call failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
    
    // 3. Check improvement plan in database
    const user = await User.findById(interview.user).populate('improvementPlan');
    
    if (user && user.improvementPlan) {
      console.log('\nUser has improvement plan in database:', user.improvementPlan._id);
      console.log('- Recommendations:', user.improvementPlan.recommendations.length);
      console.log('- Goals:', user.improvementPlan.goals.length);
      console.log('- Latest score:', user.improvementPlan.progress.latestInterviewScore);
      console.log('- Weak areas:', user.improvementPlan.progress.consistentWeakAreas.length);
      console.log('- Strength areas:', user.improvementPlan.progress.consistentStrengthAreas.length);
    } else {
      console.log('User has no improvement plan in database');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests
(async () => {
  await testImprovementPlan();
  
  // Close MongoDB connection
  setTimeout(() => {
    mongoose.connection.close();
    process.exit(0);
  }, 1000);
})();