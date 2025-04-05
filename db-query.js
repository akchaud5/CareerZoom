const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/careerzoom', {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import models
const User = require('./models/User');
const Interview = require('./models/Interview');
const Feedback = require('./models/Feedback');
const ImprovementPlan = require('./models/ImprovementPlan');
const Question = require('./models/Question');

async function showDatabaseContents() {
  try {
    // Count documents in collections
    const userCount = await User.countDocuments();
    const interviewCount = await Interview.countDocuments();
    const feedbackCount = await Feedback.countDocuments();
    const improvementPlanCount = await ImprovementPlan.countDocuments();
    const questionCount = await Question.countDocuments();

    console.log('\n=== DATABASE SUMMARY ===');
    console.log(`Users: ${userCount}`);
    console.log(`Interviews: ${interviewCount}`);
    console.log(`Feedback: ${feedbackCount}`);
    console.log(`Improvement Plans: ${improvementPlanCount}`);
    console.log(`Questions: ${questionCount}`);

    // Get recent users
    const users = await User.find().limit(5).sort({ createdAt: -1 });
    console.log('\n=== RECENT USERS ===');
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Has Improvement Plan: ${user.improvementPlan ? 'Yes' : 'No'}`);
      console.log('---');
    });

    // Get recent interviews
    const interviews = await Interview.find().limit(5).sort({ createdAt: -1 });
    console.log('\n=== RECENT INTERVIEWS ===');
    interviews.forEach(interview => {
      console.log(`ID: ${interview._id}`);
      console.log(`Title: ${interview.title}`);
      console.log(`Status: ${interview.status}`);
      console.log(`User: ${interview.user}`);
      console.log(`Feedback Count: ${interview.feedback?.length || 0}`);
      console.log(`Has Transcript: ${interview.transcript ? 'Yes' : 'No'}`);
      console.log('---');
    });

    // Get recent feedback
    const feedback = await Feedback.find().limit(5).sort({ createdAt: -1 });
    console.log('\n=== RECENT FEEDBACK ===');
    feedback.forEach(fb => {
      console.log(`ID: ${fb._id}`);
      console.log(`Interview: ${fb.interview}`);
      console.log(`Type: ${fb.type}`);
      console.log(`Overall Rating: ${fb.overallRating}`);
      console.log(`Strengths: ${fb.strengths?.join(', ')}`);
      console.log(`Improvements: ${fb.improvements?.join(', ')}`);
      console.log('---');
    });

    // Get recent improvement plans
    const plans = await ImprovementPlan.find().limit(5).sort({ createdAt: -1 });
    console.log('\n=== IMPROVEMENT PLANS ===');
    plans.forEach(plan => {
      console.log(`ID: ${plan._id}`);
      console.log(`User: ${plan.user}`);
      console.log(`Latest Score: ${plan.progress?.latestInterviewScore || 'N/A'}`);
      console.log(`Strength Areas: ${plan.progress?.consistentStrengthAreas?.join(', ') || 'None'}`);
      console.log(`Weak Areas: ${plan.progress?.consistentWeakAreas?.join(', ') || 'None'}`);
      console.log(`Recommendations: ${plan.recommendations?.length || 0}`);
      console.log(`Goals: ${plan.goals?.length || 0}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    // Close the connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
  }
}

// Run the function
showDatabaseContents();