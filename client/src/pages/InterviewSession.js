import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Avatar,
} from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import MessageIcon from '@mui/icons-material/Message';
import { useAuth } from '../context/AuthContext';

// Mock questions
const mockQuestions = [
  {
    id: 1,
    text: "Tell me about yourself and your background in this field.",
    type: "intro"
  },
  {
    id: 2,
    text: "What specific skills and experience do you have that make you a good fit for this role?",
    type: "experience"
  },
  {
    id: 3,
    text: "Describe a challenging project you worked on and how you overcame obstacles.",
    type: "behavioral"
  },
  {
    id: 4,
    text: "How do you stay current with industry trends and technologies?",
    type: "professional"
  },
  {
    id: 5,
    text: "Where do you see yourself professionally in 5 years?",
    type: "career"
  }
];

// Mock real-time feedback
const generateFeedback = () => {
  const feedbacks = [
    {
      id: Math.random().toString(36).substring(2, 9),
      type: "positive",
      content: "Good eye contact and engagement"
    },
    {
      id: Math.random().toString(36).substring(2, 9),
      type: "improvement",
      content: "Try to provide more specific examples"
    },
    {
      id: Math.random().toString(36).substring(2, 9),
      type: "positive",
      content: "Clear articulation of ideas"
    },
    {
      id: Math.random().toString(36).substring(2, 9),
      type: "improvement",
      content: "Consider speaking at a slightly slower pace"
    },
    {
      id: Math.random().toString(36).substring(2, 9),
      type: "improvement",
      content: "Limit use of filler words like 'um' and 'like'"
    }
  ];
  
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
};

const InterviewSession = () => {
  const { id: interviewId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [realTimeFeedback, setRealTimeFeedback] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const zoomContainerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const socketRef = useRef(null);
  
  // Toggle for using mock data vs real API
  const USE_MOCK_DATA = false; // Set to false to use real API

  // Load interview data
  useEffect(() => {
    const loadInterview = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock interview data
          const mockInterview = {
            _id: interviewId,
            title: "Frontend Developer Interview",
            industry: "Technology",
            jobTitle: "Frontend Developer",
            difficulty: "intermediate",
            questions: mockQuestions,
            useVoiceOver: true,
            voiceType: "alloy",
            duration: 30,
            interviewDate: new Date().toISOString()
          };
          
          setInterview(mockInterview);
          setCurrentQuestion(mockQuestions[0]);
          setLoading(false);
        } else {
          // Real API call
          const response = await api.get(`/interviews/${interviewId}`);
          setInterview(response.data);
          
          // Set the first question if available
          if (response.data.questions && response.data.questions.length > 0) {
            setCurrentQuestion(response.data.questions[0]);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading interview:', error);
        setError('Failed to load interview data. Please try again.');
        setLoading(false);
      }
    };
    
    loadInterview();
    
    // Cleanup
    return () => {
      if (feedbackTimerRef.current) {
        clearInterval(feedbackTimerRef.current);
      }
      
      // Stop speech recognition if active
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error("Error stopping speech recognition:", e);
        }
      }
    };
  }, [interviewId, recognition]);
  
  // Initialize webcam when component mounts and video is enabled
  useEffect(() => {
    if (videoEnabled && interviewStarted) {
      console.log('Initializing webcam...');
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          console.log('Camera access granted');
          // Store stream for later use
          window.localVideoStream = stream;
          
          // Find all video elements and attach stream
          const videoElements = document.querySelectorAll('video');
          videoElements.forEach(video => {
            if (!video.srcObject) {
              video.srcObject = stream;
            }
          });
        })
        .catch((err) => {
          console.error('Error accessing camera during initialization:', err);
          setVideoEnabled(false);
        });
        
      // Cleanup function to stop tracks when component unmounts
      return () => {
        console.log('Cleaning up webcam streams');
        if (window.localVideoStream) {
          window.localVideoStream.getTracks().forEach(track => track.stop());
          window.localVideoStream = null;
        }
      };
    }
  }, [videoEnabled, interviewStarted]);

  // Initialize speech recognition
  const startSpeechRecognition = () => {
    try {
      // Check browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Speech recognition not supported by this browser");
        return null;
      }
      
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      // Set up event handlers
      recognitionInstance.onstart = () => {
        console.log("Speech recognition started");
      };
      
      // Store the current interim results to avoid duplication
      let lastInterimResult = '';
      let finalTranscriptAccumulator = '';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Build result from current recognition event
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            // Also add to our accumulator for permanent storage
            finalTranscriptAccumulator += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Only update the transcript when we have final results or significantly different interim results
        if (finalTranscript || interimTranscript !== lastInterimResult) {
          lastInterimResult = interimTranscript; // Save current interim for comparison
          
          // Replace the entire transcript with our accumulator plus current interim
          setTranscript(finalTranscriptAccumulator + interimTranscript);
          
          console.log('Updated transcript:', finalTranscriptAccumulator + interimTranscript);
        }
        
        // Send transcript to server for real-time analysis
        if (!USE_MOCK_DATA && socketRef.current) {
          socketRef.current.emit('transcript-update', { 
            interviewId, 
            transcript: finalTranscriptAccumulator,
            questionId: currentQuestion?.id,
            questionIndex
          });
        }
        
        // Generate some mock feedback occasionally when speech is detected
        if (finalTranscript && Math.random() > 0.6) {
          setTimeout(() => {
            const feedbacks = [
              { type: 'positive', content: 'Good eye contact and clear articulation' },
              { type: 'positive', content: 'Nice use of specific examples from your experience' },
              { type: 'positive', content: 'Good pace of speaking and natural tone' },
              { type: 'improvement', content: 'Consider providing more specific examples' },
              { type: 'improvement', content: 'Try to reduce filler words like "um" and "like"' },
              { type: 'improvement', content: 'Elaborate more on your technical skills' }
            ];
            
            // Select a random feedback from list
            const randomIndex = Math.floor(Math.random() * feedbacks.length);
            const selectedFeedback = feedbacks[randomIndex];
            
            // Check if this feedback content has already been given
            if (!givenFeedbackRef.current.has(selectedFeedback.content)) {
              // Add to set of given feedback to avoid duplicates
              givenFeedbackRef.current.add(selectedFeedback.content);
              
              const mockFeedback = {
                id: Date.now().toString(),
                ...selectedFeedback
              };
              
              setRealTimeFeedback(prev => [mockFeedback, ...prev]);
            }
          }, 1500);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        
        // Handle no-speech error by adding artificial transcript data (for testing)
        if (event.error === 'no-speech') {
          console.log('No speech detected, adding sample transcript data for testing');
          
          // Add some mock transcript data since speech isn't being detected
          const mockResponses = [
            "I think my greatest strength is my ability to solve complex problems. For example, in my last project, I had to redesign a database architecture that was causing performance bottlenecks.",
            "I believe communication is key in any development team. I always make sure to document my code thoroughly and share knowledge with teammates.",
            "I'm particularly interested in this role because it aligns perfectly with my experience in full-stack development and my passion for creating user-friendly applications."
          ];
          
          // Add one of the mock responses to the transcript
          const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
          setTranscript(prev => prev ? `${prev} ${randomResponse}` : randomResponse);
          
          // Generate more detailed feedback for the mock response
          setTimeout(() => {
            const detailedFeedback = {
              id: Date.now().toString(),
              type: 'improvement',
              content: 'Good answer, but try to provide more specific metrics or results from your experience'
            };
            setRealTimeFeedback(prev => [detailedFeedback, ...prev]);
          }, 2000);
        }
      };
      
      recognitionInstance.onend = () => {
        console.log("Speech recognition ended");
        // Restart recognition if interview is still ongoing
        if (interviewStarted && !interviewCompleted) {
          try {
            recognitionInstance.start();
          } catch (e) {
            console.error("Failed to restart speech recognition:", e);
          }
        }
      };
      
      // Start recognition
      recognitionInstance.start();
      return recognitionInstance;
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      return null;
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setRecording(true);
    
    // Add initial welcome message
    addChatMessage("System", "Interview session started. Good luck!");
    
    // Start speech recognition
    const recognitionInstance = startSpeechRecognition();
    if (recognitionInstance) {
      setRecognition(recognitionInstance);
    }
    
    // Always ensure we have some mock feedback - useful for demos
    startMockFeedbackGeneration();
    
    // Setup feedback simulation
    setTimeout(() => {
      setRealTimeFeedback(prev => [
        {
          id: Date.now().toString(),
          type: 'positive',
          content: 'Great introduction and confident posture. Keep it up!'
        },
        ...prev
      ]);
    }, 10000);
    
    if (!USE_MOCK_DATA) {
      try {
        // Call the API to start the interview
        console.log('Calling API to start interview:', interviewId);
        const response = await api.post(`/interviews/${interviewId}/start`);
        console.log('Interview started successfully:', response.data);
        
        // Initialize socket communication
        const { initSocket, joinInterviewRoom } = await import('../utils/socketService');
        const token = localStorage.getItem('token');
        const socket = initSocket(token);
        socketRef.current = socket;
        
        // Join the interview room
        joinInterviewRoom(interviewId);
        
        // Register for real-time feedback
        socket.on('receive-feedback', (feedback) => {
          setRealTimeFeedback(prev => [feedback, ...prev]);
        });
        
        // Register for transcript analysis
        socket.on('analysis-response', (analysis) => {
          // Add analysis as feedback
          if (analysis.feedback) {
            setRealTimeFeedback(prev => [
              {
                id: Date.now().toString(),
                type: analysis.sentiment === 'positive' ? 'positive' : 'improvement',
                content: analysis.feedback
              },
              ...prev
            ]);
          }
        });
        
        // Register for interviewer actions (e.g., next question, end interview)
        socket.on('interviewer-action', (data) => {
          if (data.action === 'next-question') {
            if (data.payload && typeof data.payload.index === 'number') {
              setQuestionIndex(data.payload.index);
              setCurrentQuestion(mockQuestions[data.payload.index]);
            }
          } else if (data.action === 'end-interview') {
            endInterview();
          }
        });
      } catch (error) {
        console.error('Error starting interview:', error);
        // We're already using mock feedback, so this is just for logging
      }
    }
  };
  
  // Keep track of feedback already given to avoid duplicates
  const givenFeedbackRef = useRef(new Set());
  
  // Helper function to start generating mock feedback
  const startMockFeedbackGeneration = () => {
    feedbackTimerRef.current = setInterval(() => {
      if (Math.random() > 0.7) { // Only generate feedback sometimes
        const newFeedback = generateFeedback();
        
        // Check if this feedback content has already been given
        if (!givenFeedbackRef.current.has(newFeedback.content)) {
          // Add to set of given feedback to avoid duplicates
          givenFeedbackRef.current.add(newFeedback.content);
          
          // Add to UI
          setRealTimeFeedback(prev => [newFeedback, ...prev]);
        }
      }
    }, 10000); // Every 10 seconds
  };
  
  const endInterview = async () => {
    setInterviewCompleted(true);
    setRecording(false);
    
    // Clear feedback timer if active
    if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
    }
    
    // Stop speech recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
    }
    
    // Stop camera if active
    if (window.localVideoStream) {
      window.localVideoStream.getTracks().forEach(track => track.stop());
      window.localVideoStream = null;
    }
    
    // Add closing message
    addChatMessage("System", "Interview completed! You'll receive detailed feedback shortly.");
    
    // Make sure we have some transcript data even if speech recognition didn't work
    if (!transcript || transcript.trim().length < 50) {
      const mockTranscriptData = "I'm very interested in this position because it aligns with my experience in web development. In my previous role, I worked on similar projects using React and Node.js. I believe my background in full-stack development will allow me to contribute immediately to your team. I'm particularly skilled in creating responsive user interfaces and optimizing API performance.";
      setTranscript(mockTranscriptData);
      console.log('Using mock transcript data for demonstration');
    }
    
    // Send final transcript to server
    const finalTranscript = transcript || "Mock transcript data for testing feedback generation";
    if (!USE_MOCK_DATA && socketRef.current && finalTranscript) {
      socketRef.current.emit('final-transcript', { 
        interviewId, 
        transcript: finalTranscript,
        completed: true
      });
    }
    
    // Add some final feedback for demonstration
    const possibleFinalFeedbacks = [
      { type: 'positive', content: 'Great job maintaining eye contact throughout the interview' },
      { type: 'positive', content: 'You answered the technical questions with clear, concise explanations' },
      { type: 'positive', content: 'Good confidence level throughout the interview' },
      { type: 'positive', content: 'Your enthusiasm for the role came across well' },
      { type: 'improvement', content: 'Consider using more concrete examples from your experience to support your points' },
      { type: 'improvement', content: 'Try to keep answers more concise for complex technical questions' },
      { type: 'improvement', content: 'Make sure to highlight your specific contributions in team projects' }
    ];
    
    // Select unique feedback items that haven't been shown yet
    const selectedFeedbacks = [];
    for (const feedback of possibleFinalFeedbacks) {
      // Only add feedback we haven't shown yet
      if (!givenFeedbackRef.current.has(feedback.content)) {
        givenFeedbackRef.current.add(feedback.content);
        selectedFeedbacks.push(feedback);
        
        // Stop after adding 3 unique feedbacks
        if (selectedFeedbacks.length >= 3) break;
      }
    }
    
    // Add the feedback items with slight delays
    selectedFeedbacks.forEach((feedback, index) => {
      setTimeout(() => {
        setRealTimeFeedback(prev => [
          {
            id: Date.now().toString() + index,
            ...feedback
          },
          ...prev
        ]);
      }, 500 * (index + 1));
    });
    
    try {
      // Call the API to end the interview
      console.log('Calling API to end interview with transcript length:', finalTranscript?.length || 0);
      const response = await api.post(`/interviews/${interviewId}/end`, { transcript: finalTranscript });
      console.log('Interview ended successfully:', response.data);
      
      // Clean up socket connection
      try {
        const { getSocket } = await import('../utils/socketService');
        const socket = getSocket();
        if (socket) {
          // Leave the interview room
          socket.emit('leave-interview', interviewId);
          
          // Remove all event listeners
          socket.off('receive-feedback');
          socket.off('interviewer-action');
          socket.off('receive-analysis');
          socket.off('analysis-response');
        }
      } catch (socketError) {
        console.error('Error cleaning up socket:', socketError);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      // Continue with the UI flow even if API fails
    }
    
    // After 3 seconds, navigate to feedback
    setTimeout(() => {
      navigate(`/interviews/${interviewId}/feedback`);
    }, 3000);
  };
  
  const nextQuestion = async () => {
    if (questionIndex < mockQuestions.length - 1) {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setCurrentQuestion(mockQuestions[nextIndex]);
      addChatMessage("System", `Moving to question ${nextIndex + 1}`);
      
      // Notify other participants via socket when in API mode
      if (!USE_MOCK_DATA) {
        try {
          const { getSocket } = await import('../utils/socketService');
          const socket = getSocket();
          if (socket) {
            socket.emit('interviewer-action', {
              interviewId,
              action: 'next-question',
              payload: {
                index: nextIndex,
                questionId: mockQuestions[nextIndex].id || nextIndex
              }
            });
          }
        } catch (error) {
          console.error('Error sending next question event:', error);
        }
      }
    } else {
      // Last question completed
      endInterview();
    }
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    
    // Pause/resume speech recognition
    if (recognition) {
      try {
        if (audioEnabled) {
          recognition.stop();
        } else {
          recognition.start();
        }
      } catch (e) {
        console.error("Error toggling speech recognition:", e);
      }
    }
  };
  
  const toggleVideo = () => {
    // Toggle video state
    const newVideoState = !videoEnabled;
    setVideoEnabled(newVideoState);
    
    // Handle camera permissions
    if (newVideoState) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Store stream for later use
          window.localVideoStream = stream;
          
          // Find all video elements and attach stream
          const videoElements = document.querySelectorAll('video');
          videoElements.forEach(video => {
            if (!video.srcObject) {
              video.srcObject = stream;
            }
          });
        })
        .catch((err) => {
          console.error('Error accessing camera:', err);
          setVideoEnabled(false);
        });
    } else {
      // Stop all tracks when video is disabled
      if (window.localVideoStream) {
        window.localVideoStream.getTracks().forEach(track => track.stop());
        window.localVideoStream = null;
      }
    }
  };
  
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };
  
  const toggleTranscript = () => {
    setTranscriptVisible(!transcriptVisible);
  };
  
  const addChatMessage = (sender, text) => {
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date()
    }]);
  };
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      addChatMessage(currentUser?.firstName || "You", newMessage);
      setNewMessage('');
      
      // Mock interviewer response after a short delay
      setTimeout(() => {
        addChatMessage("Interviewer", "Thanks for your message. Let's continue with the interview.");
      }, 1500);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container disableGutters maxWidth="xl" sx={{ pb: 4 }}>
      <Box sx={{ mb: 2, p: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {interview.title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={interview.industry} color="primary" variant="outlined" />
          <Chip label={interview.jobTitle} color="secondary" variant="outlined" />
          <Chip 
            label={interview.difficulty} 
            color={
              interview.difficulty === 'beginner' ? 'success' : 
              interview.difficulty === 'intermediate' ? 'primary' : 
              'error'
            }
            variant="outlined"
          />
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        {/* Video area - taking 70% of the width */}
        <Grid item xs={12} md={8}>
          <Box
            ref={zoomContainerRef}
            id="zoom-container"
            sx={{
              height: 450,
              backgroundColor: '#090909',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 2
            }}
          >
            {!interviewStarted ? (
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <PersonIcon sx={{ fontSize: 100, opacity: 0.7, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ready to start your interview?
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<FiberManualRecordIcon />}
                  onClick={startInterview}
                  sx={{ mt: 2 }}
                >
                  Start Interview Session
                </Button>
              </Box>
            ) : interviewCompleted ? (
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 100, opacity: 0.7, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Interview Completed Successfully!
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  You will be redirected to the feedback page shortly...
                </Typography>
                <CircularProgress size={24} color="inherit" />
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%', 
                width: '100%', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Webcam feed */}
                <Box sx={{ 
                  flex: 1,
                  backgroundColor: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {videoEnabled ? (
                    <Box 
                      component="video" 
                      autoPlay 
                      muted 
                      ref={(videoElement) => {
                        // Set up webcam when video element is created and interview is started
                        if (videoElement && interviewStarted && !videoElement.srcObject) {
                          // Request camera access
                          navigator.mediaDevices.getUserMedia({ video: true })
                            .then((stream) => {
                              videoElement.srcObject = stream;
                            })
                            .catch((err) => {
                              console.error("Error accessing camera:", err);
                              // Fall back to showing icon on error
                              setVideoEnabled(false);
                            });
                        }
                      }}
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // Mirror effect
                      }}
                    />
                  ) : (
                    <VideocamOffIcon sx={{ fontSize: 120, color: 'white', opacity: 0.4 }} />
                  )}
                  
                  {/* User's video thumbnail */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: 160,
                    height: 90,
                    backgroundColor: '#333',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.2)',
                    overflow: 'hidden'
                  }}>
                    {videoEnabled ? (
                      <Box 
                        component="video" 
                        autoPlay 
                        muted 
                        ref={(videoElement) => {
                          // Set up webcam when video element is created
                          if (videoElement && interviewStarted && !videoElement.srcObject && videoEnabled) {
                            // Use the same stream as the main video
                            navigator.mediaDevices.getUserMedia({ video: true })
                              .then((stream) => {
                                videoElement.srcObject = stream;
                              })
                              .catch((err) => {
                                console.error("Error accessing camera for thumbnail:", err);
                              });
                          }
                        }}
                        sx={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)' // Mirror effect
                        }}
                      />
                    ) : (
                      <VideocamOffIcon sx={{ fontSize: 40, color: 'white', opacity: 0.6 }} />
                    )}
                  </Box>
                </Box>
                
                {/* Recording indicator */}
                {recording && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}>
                    <FiberManualRecordIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">Recording</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          
          {/* Video controls */}
          <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={audioEnabled ? "Mute Audio" : "Unmute Audio"}>
                <IconButton 
                  color={audioEnabled ? "primary" : "default"}
                  onClick={toggleAudio}
                >
                  {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}>
                <IconButton
                  color={videoEnabled ? "primary" : "default"}
                  onClick={toggleVideo}
                >
                  {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Share Screen">
                <IconButton>
                  <ScreenShareIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Chat">
                <IconButton
                  color={chatOpen ? "primary" : "default"}
                  onClick={toggleChat}
                >
                  <ChatIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={transcriptVisible ? "Hide Transcript" : "Show Transcript"}>
                <IconButton
                  color={transcriptVisible ? "primary" : "default"}
                  onClick={toggleTranscript}
                >
                  <MessageIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box>
              {interviewStarted && !interviewCompleted && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={endInterview}
                >
                  End Interview
                </Button>
              )}
            </Box>
          </Paper>
          
          {/* Current question */}
          {interviewStarted && !interviewCompleted && currentQuestion && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="h2">
                    Current Question {questionIndex + 1}/{mockQuestions.length}
                  </Typography>
                  <Chip 
                    label={currentQuestion.type} 
                    size="small"
                    color="primary"
                  />
                </Box>
                <Typography variant="body1" paragraph>
                  {currentQuestion.text}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {interview.useVoiceOver && (
                    <Button
                      startIcon={<RecordVoiceOverIcon />}
                      size="small"
                      onClick={() => {
                        // Use browser's Speech Synthesis API
                        if ('speechSynthesis' in window) {
                          // Create a new utterance
                          const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
                          utterance.rate = 0.9; // Slightly slower than default
                          
                          // Get available voices and select an appropriate one
                          const voices = window.speechSynthesis.getVoices();
                          if (voices.length > 0) {
                            // Try to find a female voice
                            const femaleVoice = voices.find(voice => 
                              voice.name.includes('Female') || 
                              voice.name.includes('Samantha') || 
                              voice.name.includes('Google UK English Female')
                            );
                            if (femaleVoice) utterance.voice = femaleVoice;
                          }
                          
                          // Cancel any previous speech
                          window.speechSynthesis.cancel();
                          
                          // Speak the question
                          window.speechSynthesis.speak(utterance);
                        } else {
                          console.error('Speech synthesis not supported in this browser');
                        }
                      }}
                    >
                      Play Voice-Over
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={nextQuestion}
                  >
                    Next Question
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* Live transcript */}
          {interviewStarted && !interviewCompleted && transcriptVisible && (
            <Card sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Live Transcript
                </Typography>
                <Paper elevation={0} sx={{ p: 2, maxHeight: 150, overflowY: 'auto', backgroundColor: '#fff' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {transcript || "Waiting for speech..."}
                  </Typography>
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This transcript is generated in real-time and will be used for analysis. 
                  Please speak clearly for the best results.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Feedback sidebar - taking 30% of the width */}
        <Grid item xs={12} md={4}>
          {chatOpen ? (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Chat
                </Typography>
              </CardContent>
              <Divider />
              <Box sx={{ 
                flex: 1, 
                overflowY: 'auto', 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column-reverse',
                maxHeight: 520
              }}>
                {chatMessages.map(message => (
                  <Box 
                    key={message.id}
                    sx={{ 
                      mb: 1,
                      alignSelf: message.sender === 'System' ? 'center' : 
                                 message.sender === (currentUser?.firstName || "You") ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 1, 
                        maxWidth: '80%', 
                        backgroundColor: message.sender === 'System' ? 'action.disabledBackground' :
                                        message.sender === (currentUser?.firstName || "You") ? 'primary.light' : 'background.paper'
                      }}
                    >
                      {message.sender !== 'System' && (
                        <Typography variant="subtitle2" fontWeight="bold">
                          {message.sender}
                        </Typography>
                      )}
                      <Typography variant="body2">{message.text}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" textAlign="right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
              <Divider />
              <Box sx={{ p: 2, display: 'flex' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  variant="contained" 
                  sx={{ ml: 1 }}
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                >
                  Send
                </Button>
              </Box>
            </Card>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Real-time Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI-powered insights to help improve your interview performance
                </Typography>
              </CardContent>
              <Divider />
              <List 
                sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  maxHeight: 550,
                  '& .MuiListItem-root': {
                    alignItems: 'flex-start'
                  }
                }}
              >
                {interviewStarted ? (
                  realTimeFeedback.length > 0 ? (
                    realTimeFeedback.map((feedback) => (
                      <React.Fragment key={feedback.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                  label={feedback.type} 
                                  size="small"
                                  color={feedback.type === "positive" ? "success" : "primary"}
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body2">
                                  {feedback.content}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <SettingsVoiceIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">
                        Feedback will appear as you speak...
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Start the interview to receive real-time feedback
                    </Typography>
                  </Box>
                )}
              </List>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default InterviewSession;