const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const interviewController = require('./controllers/interviewController');
const feedbackController = require('./controllers/feedbackController');
const authMiddleware = require('./middleware/authMiddleware');

// Authentication routes
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);

// User routes (protected)
router.get('/users/profile', authMiddleware, userController.getProfile);
router.put('/users/profile', authMiddleware, userController.updateProfile);
router.post('/users/profile/picture', authMiddleware, userController.uploadProfilePicture);

// Interview routes (protected)
router.post('/interviews', authMiddleware, interviewController.createInterview);
router.get('/interviews', authMiddleware, interviewController.getUserInterviews);

// IMPORTANT: These routes need to be before any /interviews/:id routes
// Peer collaboration routes - must be before the /:id routes
router.get('/interviews/invitations', authMiddleware, interviewController.getPeerInvitations);

// Interview specific routes with IDs
router.get('/interviews/:id', authMiddleware, interviewController.getInterviewById);
router.delete('/interviews/:id', authMiddleware, interviewController.deleteInterview);
router.post('/interviews/:id/start', authMiddleware, interviewController.startInterview);
router.post('/interviews/:id/end', authMiddleware, interviewController.endInterview);
router.post('/interviews/:id/peer-invite', authMiddleware, interviewController.invitePeer);

// Feedback routes (protected)
router.post('/interviews/:id/feedback', authMiddleware, feedbackController.saveFeedback);
router.get('/interviews/:id/feedback', authMiddleware, feedbackController.getInterviewFeedback);
router.get('/interviews/:id/improvement-plan', authMiddleware, feedbackController.getImprovementPlan);

// AI analysis routes (protected)
router.post('/interviews/:id/analyze', authMiddleware, interviewController.analyzeInterview);

// Industry-specific questions routes
router.get('/questions/industries', authMiddleware, interviewController.getIndustries);
router.get('/questions/industry/:industry', authMiddleware, interviewController.getIndustryQuestions);

// Voice and audio routes
router.get('/questions/:id/audio', authMiddleware, interviewController.getQuestionAudio);
router.get('/voices', authMiddleware, interviewController.getAvailableVoices);

module.exports = router;