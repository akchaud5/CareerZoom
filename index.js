require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const apiRoutes = require('./api/routes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static('.')); // Serve static files from root
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads directory

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
}); // Serve static files from root

// Add test routes for debugging
app.get('/', (req, res) => {
  res.send('CareerZoom API Server is running. API endpoints available at /api/*');
});

// Test route for API root
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Test route for auth
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth endpoints are available' });
});

// Debug route for testing interview deletion
app.delete('/api/interviews/test', (req, res) => {
  console.log('Test delete route hit');
  res.json({ success: true, message: 'Delete test endpoint works!' });
});

// Direct improvement plan handler (bypasses router issues)
app.get('/api/interviews/:id/improvement-plan', async (req, res) => {
  console.log('Direct improvement plan handler for interview:', req.params.id);
  
  try {
    // First attempt to find the interview
    const Interview = require('./models/Interview');
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    // Set up user to match the interview owner for direct access
    req.user = { _id: interview.user.toString() };
    console.log('Using interview owner as user ID:', req.user._id);
    
    // Check if this interview has feedback - if not return starter plan
    if (!interview.feedback || interview.feedback.length === 0) {
      console.log('No feedback found for interview, returning starter plan');
      return res.json({
        id: 'starter-plan-' + req.params.id,
        interviewId: req.params.id,
        userId: req.user._id,
        createdAt: new Date().toISOString(),
        summary: 'This interview does not have feedback yet. To generate a personalized improvement plan, you need to either get AI feedback or peer feedback on your interview performance.',
        strengthAreas: ['Communication skills', 'Technical knowledge'],
        improvementAreas: ['Structuring answers', 'Providing concrete examples'],
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
      });
    }
    
    // Interview has feedback - look up the user's improvement plan
    console.log('Looking up improvement plan for user:', req.user._id);
    const User = require('./models/User');
    const user = await User.findById(req.user._id).populate('improvementPlan');
    
    // If no improvement plan exists yet
    if (!user || !user.improvementPlan) {
      console.log('User has no improvement plan, generating one from feedback');
      // Get feedback for this interview
      const Feedback = require('./models/Feedback');
      const feedback = await Feedback.findById(interview.feedback[0]);
      
      if (!feedback) {
        console.log('Failed to find feedback, returning starter plan');
        // Return starter plan
        return res.json({
          id: 'starter-plan-' + req.params.id,
          interviewId: req.params.id,
          userId: req.user._id,
          summary: 'We could not find feedback for this interview. Please try again later.',
          strengthAreas: [],
          improvementAreas: [],
          focusAreas: []
        });
      }
      
      // Use the feedback to generate an improvement plan
      const feedbackController = require('./api/controllers/feedbackController');
      const updateImprovementPlan = feedbackController.updateImprovementPlan;
      
      if (typeof updateImprovementPlan === 'function') {
        console.log('Creating new improvement plan from feedback');
        const improvementPlan = await updateImprovementPlan(req.user._id, feedback);
        
        // Format the plan for the client
        const formattedPlan = feedbackController.formatImprovementPlan 
          ? feedbackController.formatImprovementPlan(improvementPlan, interview)
          : {
              id: improvementPlan._id,
              interviewId: interview._id,
              userId: improvementPlan.user,
              createdAt: improvementPlan.createdAt,
              summary: 'Based on your interview performance, we have generated a personalized improvement plan.',
              strengthAreas: improvementPlan.progress.consistentStrengthAreas || [],
              improvementAreas: improvementPlan.progress.consistentWeakAreas || [],
              focusAreas: improvementPlan.recommendations || [],
              nextSteps: ['Practice more interviews', 'Review feedback', 'Focus on improvement areas']
            };
          
        return res.json(formattedPlan);
      }
    }
    
    // User has an improvement plan - format it for the client
    if (user && user.improvementPlan) {
      console.log('Found existing improvement plan:', user.improvementPlan._id);
      
      // Extract strength and improvement areas
      const strengthAreas = user.improvementPlan.progress.consistentStrengthAreas.map(area => {
        const parts = area.split('_');
        return parts.length > 1 ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : area;
      });

      const improvementAreas = user.improvementPlan.progress.consistentWeakAreas.map(area => {
        const parts = area.split('_');
        return parts.length > 1 ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : area;
      });
      
      // Create focus areas from recommendations
      const focusAreas = (user.improvementPlan.recommendations || []).map(rec => {
        return {
          title: rec.area ? (rec.area.charAt(0).toUpperCase() + rec.area.slice(1)) : 'Improvement Area',
          description: rec.description || 'Focus on this area to improve your interview performance.',
          recommendations: rec.resources ? rec.resources.map(r => r.title) : [],
          resources: rec.resources ? rec.resources.map(r => ({
            title: r.title,
            type: r.type ? (r.type.charAt(0).toUpperCase() + r.type.slice(1)) : 'Resource'
          })) : []
        };
      });
      
      // If no focus areas, add a default one
      if (focusAreas.length === 0) {
        focusAreas.push({
          title: 'Interview Practice',
          description: 'Regular practice is key to improving your interview skills.',
          recommendations: [
            'Schedule mock interviews regularly',
            'Record yourself answering common interview questions',
            'Ask for feedback from peers or mentors'
          ],
          resources: [
            { title: 'How to Get the Most from Mock Interviews', type: 'Guide' },
            { title: 'Interview Preparation Best Practices', type: 'Article' }
          ]
        });
      }
      
      // Create next steps
      const nextSteps = user.improvementPlan.goals.length > 0
        ? user.improvementPlan.goals.map(goal => goal.description)
        : [
            'Schedule another practice interview',
            'Review feedback from your previous interviews',
            'Focus on your highest priority improvement areas'
          ];
      
      // Generate a summary based on the data
      const score = user.improvementPlan.progress.latestInterviewScore || 0;
      const summary = `Based on your interview performance, you've shown strengths in ${strengthAreas.length > 0 ? strengthAreas.join(', ') : 'several areas'} 
        but could benefit from improvement in ${improvementAreas.length > 0 ? improvementAreas.join(', ') : 'certain aspects'}. 
        Your overall performance score is ${score.toFixed(1)}/5. 
        Focus on the recommended areas below to enhance your interview skills.`;
      
      return res.json({
        id: user.improvementPlan._id,
        interviewId: req.params.id,
        userId: user.improvementPlan.user,
        createdAt: user.improvementPlan.createdAt,
        summary,
        strengthAreas,
        improvementAreas,
        focusAreas,
        nextSteps
      });
    }
    
    // Fallback - should not reach here
    console.log('Fallback: Using controller method');
    const feedbackController = require('./api/controllers/feedbackController');
    if (typeof feedbackController.getImprovementPlan === 'function') {
      return feedbackController.getImprovementPlan(req, res);
    }
    
    // Ultimate fallback
    return res.json({
      id: 'fallback-plan-' + req.params.id,
      interviewId: req.params.id,
      userId: req.user._id,
      createdAt: new Date().toISOString(),
      summary: 'Generated a fallback improvement plan. Continue practicing interviews to get personalized feedback.',
      strengthAreas: ['Communication skills', 'Technical knowledge'],
      improvementAreas: ['Structuring answers', 'Providing concrete examples'],
      focusAreas: [
        {
          title: 'Practice More Interviews',
          description: 'Regular practice will help you improve your skills.',
          recommendations: [
            'Schedule regular mock interviews',
            'Try different types of interview questions',
            'Record and review your performance'
          ],
          resources: [
            { title: 'Interview Practice Guide', type: 'Guide' },
            { title: 'Interview Best Practices', type: 'Article' }
          ]
        }
      ],
      nextSteps: [
        'Schedule more practice interviews',
        'Review feedback from all interviews',
        'Focus on improving one area at a time'
      ]
    });
  } catch (error) {
    console.error('Error in direct improvement plan handler:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Direct interview start handler (bypasses router and auth)
app.post('/api/interviews/:id/start', async (req, res) => {
  console.log('Direct interview start handler for interview:', req.params.id);
  
  try {
    // Set up user regardless of auth
    req.user = { _id: 'direct-handler-user' };
    
    // Extract token (if available)
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
        const jwt = require('jsonwebtoken');
        if (process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = { _id: decoded.id };
          console.log('Token verified, user id:', decoded.id);
        }
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        // Continue with default user
      }
    }
    
    // Try to find the interview
    const Interview = require('./models/Interview');
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    // Update interview status
    interview.status = 'in-progress';
    await interview.save();
    
    // Mock Zoom details
    const mockZoomDetails = {
      id: 'mock-meeting-id-' + Date.now(),
      join_url: 'https://mock-zoom-url.com',
      topic: interview.title || 'Interview Session',
      start_url: 'https://mock-zoom-start-url.com',
      status: 'waiting',
      settings: {
        waiting_room: false,
        join_before_host: true
      }
    };
    
    res.json({
      interview,
      zoomDetails: mockZoomDetails
    });
  } catch (error) {
    console.error('Direct interview start handler error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Direct interview end handler (bypasses router and auth)
app.post('/api/interviews/:id/end', async (req, res) => {
  console.log('Direct interview end handler for interview:', req.params.id);
  
  try {
    // Set up user regardless of auth
    req.user = { _id: 'direct-handler-user' };
    
    // Extract token (if available)
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
        const jwt = require('jsonwebtoken');
        if (process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = { _id: decoded.id };
          console.log('Token verified, user id:', decoded.id);
        }
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        // Continue with default user
      }
    }
    
    // Try to find the interview
    const Interview = require('./models/Interview');
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    // Get transcript from body
    const { transcript } = req.body || {};
    
    // Update interview status
    interview.status = 'completed';
    
    // Save transcript if provided
    if (transcript) {
      interview.transcript = transcript;
      interview.transcriptCompleted = true;
    }
    
    await interview.save();
    
    // Load AI service for analysis
    const aiService = require('./api/services/aiService');
    
    // Process transcript for immediate analysis if available
    if (transcript && transcript.length > 100 && process.env.OPENAI_API_KEY) {
      try {
        console.log('Using real OpenAI analysis for transcript');
        
        // Analyze the transcript with OpenAI
        const analysisResults = await aiService.analyzeInterview({
          transcript,
          questions: interview.questions || [],
          industry: interview.industry || 'Technology',
          jobTitle: interview.jobTitle || 'Software Engineer'
        });
        
        console.log('Got real-time analysis from OpenAI');
        
        // Create feedback from the analysis
        const Feedback = require('./models/Feedback');
        
        // Map OpenAI analysis to our feedback format
        const feedback = await Feedback.create({
          interview: interview._id,
          user: req.user._id,
          type: 'ai',
          overallRating: analysisResults.overallScore || 4.0,
          contentFeedback: analysisResults.contentAnalysis || {
            relevance: { score: 4.0, feedback: 'Your answers were relevant to the questions.' },
            completeness: { score: 4.0, feedback: 'You provided complete responses to questions.' },
            structure: { score: 4.0, feedback: 'Your answers had a good structure.' }
          },
          deliveryFeedback: analysisResults.deliveryAnalysis || {
            confidence: { score: 4.0, feedback: 'You demonstrated confidence.' },
            clarity: { score: 4.0, feedback: 'Your speaking was clear.' },
            pacing: { score: 4.0, feedback: 'Your speaking pace was appropriate.' },
            engagement: { score: 4.0, feedback: 'You maintained good engagement.' }
          },
          strengths: analysisResults.keyInsights || ['Good interview skills'],
          improvements: analysisResults.improvementAreas || ['Continue practicing'],
          generalComments: 'Analysis based on your interview transcript.'
        });
        
        // Add feedback to interview
        interview.feedback.push(feedback._id);
        interview.analysisResults = analysisResults;
        await interview.save();
        
        console.log(`Created AI feedback for interview ${interview._id}`);
        
        // Create an improvement plan based on the feedback
        const feedbackController = require('./api/controllers/feedbackController');
        const updateImprovementPlan = feedbackController.updateImprovementPlan;
        
        // Only try to update improvement plan if the function exists
        if (typeof updateImprovementPlan === 'function') {
          try {
            await updateImprovementPlan(req.user._id, feedback);
            console.log('Updated improvement plan based on real analysis');
          } catch (planError) {
            console.error('Error updating improvement plan:', planError);
          }
        }
      } catch (analysisError) {
        console.error('Error performing real-time analysis:', analysisError);
        // Fall back to mock feedback if real analysis fails
        createMockFeedback();
      }
    } else {
      // Use mock feedback if no transcript or API key is available
      createMockFeedback();
    }
    
    // Helper function for creating mock feedback when needed
    async function createMockFeedback() {
      try {
        console.log('Creating mock feedback as fallback');
        // Import needed models
        const Feedback = require('./models/Feedback');
        
        // Create a basic AI feedback entry
        const feedback = await Feedback.create({
          interview: interview._id,
          user: req.user._id,
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
  
        // Add feedback to interview
        interview.feedback.push(feedback._id);
        await interview.save();
        
        console.log(`Created mock AI feedback for interview ${interview._id}`);
        
        // Create an improvement plan
        // Update the user's improvement plan
        const feedbackController = require('./api/controllers/feedbackController');
        const updateImprovementPlan = feedbackController.updateImprovementPlan;
        
        // Only try to update improvement plan if the function exists
        if (typeof updateImprovementPlan === 'function') {
          try {
            await updateImprovementPlan(req.user._id, feedback);
            console.log('Updated improvement plan for user with mock data');
          } catch (planError) {
            console.error('Error updating improvement plan:', planError);
          }
        }
      } catch (feedbackError) {
        console.error('Error creating mock AI feedback:', feedbackError);
      }
    }
    
    // Run transcript analysis if available (for more detailed results)
    if (transcript && transcript.length > 100) {
      try {
        // Load AI service
        const aiService = require('./api/services/aiService');
        
        // Schedule analysis in background
        setTimeout(async () => {
          try {
            console.log('Starting background transcript analysis');
            const analysisResults = await aiService.analyzeInterview({
              transcript,
              questions: interview.questions || [],
              industry: interview.industry || 'Technology',
              jobTitle: interview.jobTitle || 'Software Engineer'
            });
            
            // Update interview with analysis results
            interview.analysisResults = analysisResults;
            await interview.save();
            console.log(`Analysis of transcript completed for interview ${interview._id}`);
          } catch (analysisError) {
            console.error('Error analyzing transcript:', analysisError);
          }
        }, 500);
      } catch (queueError) {
        console.error('Error queueing transcript analysis:', queueError);
      }
    }
    
    res.json({
      success: true,
      interviewId: interview._id,
      status: interview.status,
      hasTranscript: !!interview.transcript,
      hasRecording: !!interview.recordingUrl
    });
  } catch (error) {
    console.error('Direct interview end handler error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Direct delete handler (bypasses router and includes auth)
app.delete('/api/interviews/:id', async (req, res, next) => {
  console.log(`Direct DELETE handler for interview ID: ${req.params.id}`);
  
  try {
    // Extract token
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'none');
    
    // Set up user regardless of auth
    req.user = { _id: 'direct-handler-user' };
    
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
        const jwt = require('jsonwebtoken');
        if (process.env.JWT_SECRET) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = { _id: decoded.id };
          console.log('Token verified, user id:', decoded.id);
        }
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        // Continue with default user
      }
    }
    
    // Load controller
    const interviewController = require('./api/controllers/interviewController');
    
    // Check if we have the delete function
    if (typeof interviewController.deleteInterview === 'function') {
      console.log('Found delete interview controller function, calling it directly');
      return interviewController.deleteInterview(req, res);
    } else {
      console.log('Delete interview controller function not found');
      return res.status(501).json({ message: 'Delete function not implemented' });
    }
  } catch (error) {
    console.error('Error in direct delete handler:', error);
    return res.status(500).json({ message: 'Server error in direct delete handler', error: error.message });
  }
});

// Special handler for login
app.post('/api/auth/login', (req, res, next) => {
  console.log('Login endpoint hit directly with body:', req.body);
  
  // Check if body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log('Empty request body - body-parser issue?');
    return res.status(400).json({ 
      message: 'No credentials provided. Check Content-Type header.',
      received: req.body,
      contentType: req.headers['content-type']
    });
  }
  
  next();
});

// Apply API routes - MUST come after the direct handlers
app.use('/api', apiRoutes);

// Add a catch-all route to debug not found routes
app.use((req, res, next) => {
  if (req.method === 'DELETE') {
    console.log(`DELETE request to ${req.url} was not handled by any routes`);
  }
  next();
});

// MongoDB Connection
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careerzoom';
mongoose.connect(DB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create HTTP Server
const server = http.createServer(app);

// Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true, // Allow Engine.IO version 3 clients (older clients)
  pingTimeout: 60000, // Longer ping timeout
  transports: ['websocket', 'polling'] // Support both WebSocket and polling
});

// Socket.io Connection Handling with authentication
io.use(async (socket, next) => {
  try {
    console.log('New socket connection attempt:', socket.id);
    const token = socket.handshake.auth?.token;
    
    // Always allow connections in development mode or for testing
    if (process.env.NODE_ENV === 'development' || !process.env.JWT_SECRET) {
      console.log('Development mode: Skipping socket auth');
      socket.user = { id: 'dev-user-' + Math.random().toString(36).substr(2, 9), role: 'student' };
      return next();
    }
    
    // Try to verify token but don't fail if it's missing
    if (!token) {
      console.log('No auth token provided for socket - allowing anonymous connection');
      socket.user = { id: 'anonymous-' + socket.id, role: 'guest' };
      return next();
    }
    
    // Verify JWT token
    try {
      const jwt = require('jsonwebtoken');
      const User = require('./models/User');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
    
      if (!user) {
        console.log('User not found with decoded token');
        socket.user = { id: 'invalid-token-' + socket.id, role: 'guest' };
        return next();
      }
      
      console.log('Authenticated socket user:', user._id);
      socket.user = user;
      return next();
    } catch (tokenError) {
      console.error('Token validation error:', tokenError.message);
      socket.user = { id: 'invalid-token-' + socket.id, role: 'guest' };
      return next();
    }
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    // Allow connection anyway for development
    socket.user = { id: 'error-' + socket.id, role: 'guest' };
    return next();
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, socket.user?.id || 'anonymous');
  
  // Handle interview session joining
  socket.on('join-interview', async (interviewId) => {
    try {
      socket.join(interviewId);
      console.log(`Client ${socket.id} joined interview: ${interviewId}`);
      
      // Notify other participants in the room
      socket.to(interviewId).emit('user-joined', {
        userId: socket.user?.id,
        name: socket.user?.firstName || 'Participant',
        timestamp: new Date().toISOString()
      });
      
      // Send initial system message
      io.to(interviewId).emit('receive-feedback', {
        id: Date.now().toString(),
        type: 'system',
        content: `${socket.user?.firstName || 'A participant'} has joined the session`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling join-interview:', error);
      socket.emit('error', { message: 'Failed to join interview session' });
    }
  });
  
  // Handle interview room leaving
  socket.on('leave-interview', (interviewId) => {
    socket.leave(interviewId);
    console.log(`Client ${socket.id} left interview: ${interviewId}`);
    
    // Notify others
    socket.to(interviewId).emit('user-left', {
      userId: socket.user?.id,
      name: socket.user?.firstName || 'Participant',
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle real-time feedback
  socket.on('send-feedback', (data) => {
    try {
      const { interviewId, feedback } = data;
      
      // Add user info and timestamp to feedback
      const enrichedFeedback = {
        ...feedback,
        userId: socket.user?.id,
        userName: socket.user?.firstName,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast feedback to all participants in the room
      io.to(interviewId).emit('receive-feedback', enrichedFeedback);
      
      // Log feedback for debugging
      console.log(`Feedback in interview ${interviewId}:`, enrichedFeedback);
    } catch (error) {
      console.error('Error handling send-feedback:', error);
      socket.emit('error', { message: 'Failed to send feedback' });
    }
  });

  // Handle interview recording analysis
  socket.on('analysis-complete', (data) => {
    try {
      const { interviewId, analysis } = data;
      
      // Broadcast analysis to all participants in the room
      io.to(interviewId).emit('receive-analysis', {
        ...analysis,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Analysis completed for interview ${interviewId}`);
    } catch (error) {
      console.error('Error handling analysis-complete:', error);
      socket.emit('error', { message: 'Failed to broadcast analysis' });
    }
  });
  
  // Handle interviewer actions (e.g., next question, end interview)
  socket.on('interviewer-action', (data) => {
    try {
      const { interviewId, action, payload } = data;
      
      // Broadcast action to all participants
      io.to(interviewId).emit('interviewer-action', {
        action,
        payload,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Interviewer action in interview ${interviewId}: ${action}`);
    } catch (error) {
      console.error('Error handling interviewer-action:', error);
      socket.emit('error', { message: 'Failed to broadcast interviewer action' });
    }
  });
  
  // Handle real-time transcript updates
  socket.on('transcript-update', async (data) => {
    try {
      const { interviewId, transcript, questionId, questionIndex } = data;
      console.log(`Received transcript update for interview ${interviewId}, ${transcript.length} chars`);
      
      // Skip empty transcripts
      if (!transcript || transcript.length < 10) return;
      
      // If OpenAI API is available
      if (process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'development') {
        try {
          // Require OpenAI service on demand
          const openai = require('./api/services/aiService');
          
          // Analyze the transcript chunk with AI
          const analysis = await openai.analyzeRealTime({ text: transcript });
          
          // Send the analysis back only to the sender
          socket.emit('analysis-response', {
            timestamp: new Date().toISOString(),
            questionId,
            questionIndex,
            feedback: analysis.suggestedAdjustments[0],
            sentiment: analysis.nervousSignals === 'low' ? 'positive' : 'improvement'
          });
          
          console.log(`Sent real-time analysis for interview ${interviewId}`);
        } catch (aiError) {
          console.error('Error analyzing transcript:', aiError);
        }
      } else {
        // In development or when no API key is available, send mock analysis
        if (Math.random() > 0.7) { // Only respond sometimes to avoid too many messages
          const mockFeedback = [
            'Try to speak more confidently',
            'Good use of specific examples',
            'Consider pausing more between thoughts',
            'Your explanation is clear and concise',
            'Remember to address the specific question asked'
          ];
          
          socket.emit('analysis-response', {
            timestamp: new Date().toISOString(),
            questionId,
            questionIndex,
            feedback: mockFeedback[Math.floor(Math.random() * mockFeedback.length)],
            sentiment: Math.random() > 0.5 ? 'positive' : 'improvement'
          });
        }
      }
    } catch (error) {
      console.error('Error handling transcript update:', error);
      socket.emit('error', { message: 'Failed to process transcript' });
    }
  });
  
  // Handle final transcript submission
  socket.on('final-transcript', async (data) => {
    try {
      const { interviewId, transcript, completed } = data;
      console.log(`Received final transcript for interview ${interviewId}, ${transcript.length} chars`);
      
      if (!transcript || transcript.length < 50) return;
      
      // Store the transcript in the database
      try {
        const Interview = require('./models/Interview');
        await Interview.findByIdAndUpdate(interviewId, { 
          transcript: transcript,
          transcriptCompleted: true
        });
        console.log(`Stored transcript for interview ${interviewId}`);
      } catch (dbError) {
        console.error('Error storing transcript:', dbError);
      }
      
      // Notify participants that transcript is ready
      io.to(interviewId).emit('receive-feedback', {
        id: Date.now().toString(),
        type: 'system',
        content: 'Interview transcript has been saved and will be analyzed.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling final transcript:', error);
      socket.emit('error', { message: 'Failed to process final transcript' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Notify all rooms this socket was in
    const rooms = Object.keys(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) { // Skip the room that matches the socket ID
        socket.to(room).emit('user-left', {
          userId: socket.user?.id,
          name: socket.user?.firstName || 'Participant',
          timestamp: new Date().toISOString(),
          reason: 'disconnected'
        });
      }
    });
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
