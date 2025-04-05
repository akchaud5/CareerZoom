import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InsightsIcon from '@mui/icons-material/Insights';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useAuth } from '../context/AuthContext';

const FeedbackDetail = () => {
  const { id: interviewId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  // Toggle for using mock data vs real API
  const USE_MOCK_DATA = false; // Set to false to use real API

  // Load feedback data
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          // Mock feedback data
          const mockFeedback = {
          interviewId,
          interviewTitle: "Frontend Developer Interview",
          date: new Date().toISOString(),
          duration: "28 minutes",
          overallRating: 4.2,
          communicationRating: 4.5,
          technicalRating: 3.8,
          confidenceRating: 4.0,
          sections: [
            {
              title: "Communication Skills",
              score: 4.5,
              feedback: "You demonstrated strong verbal communication skills with clear articulation and good pacing. Your responses were well-structured and easy to follow. Consider reducing filler words like 'um' and 'like' to sound more polished."
            },
            {
              title: "Technical Knowledge",
              score: 3.8,
              feedback: "You showed good understanding of frontend technologies and frameworks. Your explanation of React component lifecycle was accurate. There's room for improvement in explaining more complex concepts like state management and optimization techniques."
            },
            {
              title: "Problem-Solving Approach",
              score: 4.0,
              feedback: "You demonstrated a structured approach to problem-solving. You asked clarifying questions and communicated your thought process well. Try to provide more specific examples from your past work to illustrate your problem-solving abilities."
            },
            {
              title: "Cultural Fit & Soft Skills",
              score: 4.3,
              feedback: "You came across as enthusiastic and collaborative. Your examples of past teamwork were relevant and demonstrated your ability to work well with others. Your answers aligned well with common company values."
            }
          ],
          strengths: [
            "Clear and concise communication style",
            "Good technical foundation in frontend development",
            "Effective use of specific examples to illustrate points",
            "Positive and enthusiastic attitude",
            "Structured problem-solving approach"
          ],
          areasForImprovement: [
            "More depth in technical explanations",
            "Reducing use of filler words",
            "More specific examples of handling challenges",
            "More questions about the role and company"
          ],
          keywordAnalysis: [
            { word: "React", count: 12, relevance: "high" },
            { word: "component", count: 8, relevance: "high" },
            { word: "testing", count: 5, relevance: "medium" },
            { word: "performance", count: 3, relevance: "medium" },
            { word: "team", count: 7, relevance: "high" },
            { word: "collaboration", count: 4, relevance: "high" }
          ],
          questionResponses: [
            {
              question: "Tell me about yourself and your background in this field.",
              strengths: "Clear introduction with relevant experience highlighted.",
              improvements: "Could be more concise and focus more on recent experiences."
            },
            {
              question: "What specific skills and experience do you have that make you a good fit for this role?",
              strengths: "Good alignment of skills with job requirements.",
              improvements: "Provide more specific metrics and achievements."
            },
            {
              question: "Describe a challenging project you worked on and how you overcame obstacles.",
              strengths: "Good example with clear problem definition.",
              improvements: "More details on your specific contributions would strengthen this answer."
            },
            {
              question: "How do you stay current with industry trends and technologies?",
              strengths: "Demonstrated commitment to continuous learning.",
              improvements: "Could mention more specific resources and learning strategies."
            }
          ],
          suggestions: [
            "Practice more technical interview questions",
            "Work on providing more metrics and quantifiable achievements",
            "Prepare more questions about the company and role",
            "Continue to build portfolio projects to demonstrate skills"
          ]
        };
        
        setFeedback(mockFeedback);
        setLoading(false);
        } else {
          // Real API call
          try {
            const response = await api.get(`/interviews/${interviewId}/feedback`);
            setFeedback(response.data);
          } catch (apiError) {
            console.error('API error loading feedback:', apiError);
            setError('Failed to load feedback data from API. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading feedback:', error);
        setError('Failed to load feedback data. Please try again.');
        setLoading(false);
      }
    };
    
    loadFeedback();
  }, [interviewId]);

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
  
  // If feedback is not available or is empty/invalid, show a message
  if (!feedback || (Array.isArray(feedback) && feedback.length === 0)) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 4 }}>No feedback available for this interview.</Alert>
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
  
  // Handle feedback as an array
  const feedbackData = Array.isArray(feedback) ? feedback[0] : feedback;

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Interview Feedback
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {feedbackData.interviewTitle || 'Interview'} • {feedbackData.date ? new Date(feedbackData.date).toLocaleDateString() : 'No date'} • {feedbackData.duration || 'Unknown duration'}
        </Typography>
      </Box>
      
      {/* Overall ratings section */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h5" gutterBottom>
          Overall Assessment
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>Overall Rating</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ mr: 1 }}>
                  {(feedbackData.overallRating || 0).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">/ 5.0</Typography>
              </Box>
              <Rating value={feedbackData.overallRating || 0} precision={0.1} readOnly sx={{ mt: 1 }} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Communication</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(feedbackData.communicationRating || 0) * 20} 
                    sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 2 }} 
                  />
                  <Typography variant="body2">{feedbackData.communicationRating || 0}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Technical Knowledge</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(feedbackData.technicalRating || 0) * 20} 
                    sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 2 }} 
                  />
                  <Typography variant="body2">{feedbackData.technicalRating || 0}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Confidence</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(feedbackData.confidenceRating || 0) * 20} 
                    sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 2 }} 
                  />
                  <Typography variant="body2">{feedbackData.confidenceRating || 0}</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Key Takeaways
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <ThumbUpIcon color="success" sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="body2">
                      Strong communication skills with clear articulation and good pacing.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <ThumbDownIcon color="error" sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="body2">
                      Need more depth in technical explanations and specific examples.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Detailed assessment sections */}
      <Typography variant="h5" component="h2" gutterBottom>
        Detailed Assessment
      </Typography>
      
      <Grid container spacing={3}>
        {(feedbackData.sections || []).map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">{section.title}</Typography>
                  <Box sx={{ 
                    bgcolor: 
                      section.score >= 4.5 ? 'success.light' : 
                      section.score >= 3.5 ? 'primary.light' : 
                      'warning.light',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      {section.score.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {section.feedback}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Strengths and areas for improvement */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Strengths</Typography>
            </Box>
            <List dense>
              {(feedbackData.strengths || []).map((strength, index) => (
                <ListItem key={index}>
                  <ListItemText primary={strength} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ErrorIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Areas for Improvement</Typography>
            </Box>
            <List dense>
              {(feedbackData.areasForImprovement || []).map((area, index) => (
                <ListItem key={index}>
                  <ListItemText primary={area} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Question responses */}
      <Paper sx={{ p: 3, mt: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Question-by-Question Analysis
        </Typography>
        
        {(feedbackData.questionResponses || []).map((response, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Q{index + 1}: {response.question}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <ThumbUpIcon color="success" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                  <Typography variant="body2">
                    <b>Strengths:</b> {response.strengths}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <ThumbDownIcon color="error" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                  <Typography variant="body2">
                    <b>Improvements:</b> {response.improvements}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {index < feedback.questionResponses.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Paper>
      
      {/* Keyword analysis */}
      <Paper sx={{ p: 3, mt: 4 }} elevation={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InsightsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Keyword Analysis</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Common terms and phrases used during your interview:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {(feedbackData.keywordAnalysis || []).map((keyword, index) => (
            <Chip 
              key={index}
              label={`${keyword.word} (${keyword.count})`}
              color={keyword.relevance === 'high' ? 'primary' : 'default'}
              variant={keyword.relevance === 'high' ? 'filled' : 'outlined'}
              size="medium"
            />
          ))}
        </Box>
      </Paper>
      
      {/* Suggestions */}
      <Paper sx={{ p: 3, mt: 4, mb: 4 }} elevation={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LightbulbIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Recommendations for Improvement</Typography>
        </Box>
        <List>
          {(feedbackData.suggestions || []).map((suggestion, index) => (
            <ListItem key={index}>
              <ListItemText primary={suggestion} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              try {
                console.log('Navigating to improvement plan with ID:', interviewId);
                // Verify interviewId is valid
                if (!interviewId || interviewId === 'undefined') {
                  console.error('Invalid interview ID for navigation:', interviewId);
                  alert('Cannot navigate to improvement plan - invalid interview ID');
                  return;
                }
                // Use replace: true to prevent issues with back navigation
                navigate(`/improvement-plan/${interviewId}`, { replace: true });
              } catch (navError) {
                console.error('Navigation error:', navError);
                alert('Error navigating to improvement plan');
              }
            }}
          >
            View Improvement Plan
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FeedbackDetail;