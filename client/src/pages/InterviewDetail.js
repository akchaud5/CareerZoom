import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Divider, 
  List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/interviews/${id}`);
        setInterview(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching interview details');
        setLoading(false);
        console.error('Error fetching interview:', err);
      }
    };

    fetchInterview();
  }, [id]);

  const startInterview = () => {
    navigate(`/interviews/${id}/session`);
  };

  const viewFeedback = () => {
    navigate(`/interviews/${id}/feedback`);
  };

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
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!interview) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Interview not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {interview.title}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={interview.industry} 
            color="primary" 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={interview.jobTitle} 
            color="secondary" 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={interview.difficulty} 
            color="default" 
            sx={{ mb: 1 }} 
          />
        </Box>
        
        <Typography variant="body1" paragraph>
          {interview.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Created: {new Date(interview.createdAt).toLocaleDateString()}
            </Typography>
            {interview.scheduledFor && (
              <Typography variant="subtitle2" color="text.secondary">
                Scheduled: {new Date(interview.scheduledFor).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status: {interview.status}
            </Typography>
            {interview.duration && (
              <Typography variant="subtitle2" color="text.secondary">
                Duration: {interview.duration} minutes
              </Typography>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Sample Questions
        </Typography>
        
        <List>
          {interview.questions?.slice(0, 3).map((question, index) => (
            <ListItem key={index} sx={{ backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover', py: 1 }}>
              <ListItemText primary={question.text} secondary={question.category} />
            </ListItem>
          ))}
          {interview.questions?.length > 3 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              And {interview.questions.length - 3} more questions...
            </Typography>
          )}
        </List>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          {['scheduled', 'pending'].includes(interview.status) && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={startInterview}
            >
              Start Interview
            </Button>
          )}
          
          {['completed'].includes(interview.status) && (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={viewFeedback}
            >
              View Feedback
            </Button>
          )}
          
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

export default InterviewDetail;