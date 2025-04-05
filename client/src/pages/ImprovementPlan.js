import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Divider, 
  List, ListItem, ListItemText, Chip, CircularProgress,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Mock data for development
const mockImprovementPlan = {
  id: '123',
  interviewId: '456',
  userId: '789',
  createdAt: new Date().toISOString(),
  summary: 'Your interview showed strong technical knowledge but could benefit from improved communication skills and more structured responses. Focus on STAR method for behavioral questions and practice concise technical explanations.',
  strengthAreas: [
    'Technical knowledge',
    'Problem-solving',
    'Enthusiasm',
    'Industry knowledge'
  ],
  improvementAreas: [
    'Communication clarity',
    'Structured responses',
    'Concise answers',
    'Body language'
  ],
  focusAreas: [
    {
      title: 'Structured Interview Responses',
      description: 'Your answers sometimes lacked clear structure, making it difficult for the interviewer to follow your thought process. Implementing the STAR method would significantly improve your responses.',
      recommendations: [
        'Practice the STAR method (Situation, Task, Action, Result) for all behavioral questions',
        'Prepare 5-7 stories that can be adapted to different behavioral questions',
        'Record yourself answering mock interview questions and review for structure',
        'Limit responses to 2-3 minutes maximum'
      ],
      resources: [
        { title: 'The STAR Interview Method Guide', type: 'Article' },
        { title: 'Structured Interview Response Workshop', type: 'Video Course' }
      ]
    },
    {
      title: 'Technical Communication',
      description: 'While your technical knowledge is strong, your explanations sometimes included unnecessary details or technical jargon that might confuse non-technical interviewers.',
      recommendations: [
        'Practice explaining technical concepts to non-technical friends/family',
        'Use analogies to explain complex technical concepts',
        'Start with high-level explanations before diving into details',
        'Ask if your explanation makes sense before continuing'
      ],
      resources: [
        { title: 'Explaining Technical Concepts Clearly', type: 'Book' },
        { title: 'Communication for Engineers', type: 'Online Course' }
      ]
    },
    {
      title: 'Body Language and Presence',
      description: 'Your body language sometimes conveyed nervousness or uncertainty. Improving your non-verbal communication will strengthen your overall interview presence.',
      recommendations: [
        'Practice maintaining eye contact (or camera focus in virtual interviews)',
        'Reduce filler words like "um" and "uh"',
        'Adopt an open posture - shoulders back, hands visible',
        'Practice conscious breathing techniques before and during interviews'
      ],
      resources: [
        { title: 'The Power of Non-verbal Communication', type: 'Workshop' },
        { title: 'Virtual Interview Body Language', type: 'Article' }
      ]
    }
  ],
  nextSteps: [
    'Schedule 3 mock interviews with CareerZoom in the next two weeks',
    'Complete the "Structured Interview Responses" workshop',
    'Record and review at least 5 practice responses using the STAR method',
    'Join our Interview Body Language webinar next Tuesday'
  ]
};

const ImprovementPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle for using mock data vs real API
  const USE_MOCK_DATA = false; // Using real API data

  // On first render, verify we have a valid ID
  useEffect(() => {
    // Check if ID is just a placeholder number
    if (id === '123') {
      setError('Please select a valid interview from the dashboard first.');
      setLoading(false);
      return;
    }

    const fetchImprovementPlan = async () => {
      try {
        setLoading(true);
        console.log(`Attempting to fetch improvement plan for interview ID: ${id}`);
        
        if (USE_MOCK_DATA) {
          // Use mock data
          setTimeout(() => {
            setPlan(mockImprovementPlan);
            setLoading(false);
          }, 1000); // Simulate network delay
        } else {
          // Real API call
          try {
            // Check if the interview exists first
            const interviewResponse = await api.get(`/interviews/${id}`);
            console.log(`Found interview:`, interviewResponse.data);
            
            // Then get the improvement plan
            const response = await api.get(`/interviews/${id}/improvement-plan`);
            console.log('Improvement plan response:', response.data);
            
            // If we get a valid plan, set it
            if (response.data) {
              setPlan(response.data);
            } else {
              console.warn('Received empty improvement plan');
              // Still set the plan to null - empty plan is still valid but will show "No plan" UI
              setPlan(null);
            }
          } catch (apiError) {
            console.error('API error:', apiError);
            
            if (apiError.response && apiError.response.status === 404) {
              // Handle 404 - Interview not found or no improvement plan
              if (apiError.response.data && apiError.response.data.message) {
                throw new Error(apiError.response.data.message);
              } else {
                throw new Error('Interview not found or no improvement plan available.');
              }
            } else {
              // Re-throw for the outer catch block
              throw apiError;
            }
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        let errorMessage = 'Error fetching improvement plan';
        
        // Check for 404 errors - no interview found
        if (err.response && err.response.status === 404) {
          errorMessage = 'Interview not found. Please ensure you have a valid interview.';
        }
        // Unauthorized access
        else if (err.response && err.response.status === 403) {
          errorMessage = 'You are not authorized to access this improvement plan.';
        }
        // Server error
        else if (err.response && err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        // Custom message from server or from our error throw
        else if ((err.response && err.response.data && err.response.data.message) || err.message) {
          errorMessage = err.response?.data?.message || err.message;
        }
        
        setError(errorMessage);
        setLoading(false);
        console.error('Error fetching improvement plan:', err);
      }
    };

    if (id) {
      fetchImprovementPlan();
    }
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography paragraph>
            We couldn't fetch your improvement plan: {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!plan) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No Improvement Plan Available Yet
          </Typography>
          <Typography paragraph>
            You need to complete at least one interview with feedback to generate a personalized improvement plan.
          </Typography>
          <Typography paragraph color="text.secondary">
            Complete an interview by following these steps:
          </Typography>
          <Box sx={{ textAlign: 'left', mb: 3, maxWidth: '500px', mx: 'auto' }}>
            <ol>
              <li><Typography paragraph>Create a new interview from the dashboard</Typography></li>
              <li><Typography paragraph>Take the interview or schedule it for later</Typography></li>
              <li><Typography paragraph>Answer the interview questions</Typography></li>
              <li><Typography paragraph>Receive AI or peer feedback on your performance</Typography></li>
            </ol>
          </Box>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/interviews/create')}
            >
              Create New Interview
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Your Personalized Improvement Plan
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Based on your interview on {new Date(plan.createdAt).toLocaleDateString()}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {plan.summary}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {plan.strengthAreas?.map((strength, index) => (
              <Chip 
                key={index}
                label={strength} 
                color="success" 
                variant="outlined"
              />
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {plan.improvementAreas?.map((area, index) => (
              <Chip 
                key={index}
                label={area} 
                color="error" 
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Focus Areas
        </Typography>
        
        {plan.focusAreas?.map((area, index) => (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{area.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>{area.description}</Typography>
              <Typography variant="subtitle2">Recommendations:</Typography>
              <List dense>
                {area.recommendations.map((rec, recIndex) => (
                  <ListItem key={recIndex}>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
              
              {area.resources && area.resources.length > 0 && (
                <>
                  <Typography variant="subtitle2">Resources:</Typography>
                  <List dense>
                    {area.resources.map((resource, resIndex) => (
                      <ListItem key={resIndex}>
                        <ListItemText 
                          primary={resource.title} 
                          secondary={resource.type} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Next Steps
        </Typography>
        
        <List>
          {plan.nextSteps?.map((step, index) => (
            <ListItem key={index} sx={{ backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover', py: 1 }}>
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(`/interviews/${id}/feedback`)}
          >
            View Interview Feedback
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ImprovementPlan;