// Debug script for interview start endpoint
const axios = require('axios');
const mongoose = require('mongoose');

// Set up MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/careerzoom', {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import models
const Interview = require('./models/Interview');
const zoomService = require('./api/services/zoomService');

// Test the getMeeting function directly
async function testZoomService() {
  try {
    console.log('--- Testing zoomService.getMeeting directly ---');
    
    // Test with a real meetingId
    const interview = await Interview.findById('67f03c7d5336d0f68a84a38a');
    
    if (!interview) {
      console.log('Interview not found');
      return;
    }
    
    console.log('Interview found:', interview._id);
    console.log('Zoom Meeting ID:', interview.zoomMeetingId);
    
    if (!interview.zoomMeetingId) {
      console.log('No Zoom meeting ID found');
      return;
    }
    
    try {
      const meetingDetails = await zoomService.getMeeting(interview.zoomMeetingId);
      console.log('Meeting details:', meetingDetails);
    } catch (zoomError) {
      console.error('Error fetching Zoom meeting details:', zoomError);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Test the /api/interviews/:id/start endpoint
async function testInterviewStart() {
  try {
    console.log('--- Testing interview start endpoint ---');
    
    // Get a real token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'yes' : 'no');
    
    // Call the interview start endpoint
    const response = await axios.post(
      'http://localhost:5000/api/interviews/67f03c7d5336d0f68a84a38a/start',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('API call failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run tests
(async () => {
  await testZoomService();
  console.log('\n');
  await testInterviewStart();
  
  // Close MongoDB connection
  setTimeout(() => {
    mongoose.connection.close();
    process.exit(0);
  }, 1000);
})();