import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '../utils/api';
import { useContext } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ createMode, planMode, profileMode }) => {
  const { currentUser } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [peerInvitations, setPeerInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0 for My Interviews, 1 for Peer Reviews
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    // Toggle to use mock data vs real API
    const USE_MOCK_DATA = false; // Set to false to use real API
    
    if (USE_MOCK_DATA) {
      // Mock data for development
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const mockInterviews = [
          {
            _id: '1',
            title: 'Frontend Developer Interview',
            industry: 'Technology',
            jobTitle: 'Frontend Developer',
            difficulty: 'intermediate',
            status: 'scheduled',
            interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            peerReviewers: []
          },
          {
            _id: '2',
            title: 'Software Engineer Interview',
            industry: 'Technology',
            jobTitle: 'Software Engineer',
            difficulty: 'advanced',
            status: 'completed',
            interviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            peerReviewers: [{id: '123'}]
          }
        ];
        
        const mockInvitations = [];
        
        setInterviews(mockInterviews);
        setPeerInvitations(mockInvitations);
        setLoading(false);
      }, 1000);
    } else {
      const fetchInterviews = async () => {
        try {
          setLoading(true);
          setError('');
          
          // Fetch interviews with error handling for each request
          try {
            const interviewsRes = await api.get('/interviews');
            setInterviews(interviewsRes.data);
          } catch (interviewErr) {
            console.error('Error fetching interviews:', interviewErr);
            setInterviews([]);
          }
          
          // Fetch invitations with separate error handling
          try {
            const invitationsRes = await api.get('/interviews/invitations');
            setPeerInvitations(invitationsRes.data);
          } catch (invitationErr) {
            console.error('Error fetching invitations:', invitationErr);
            setPeerInvitations([]);
          }
        } catch (err) {
          console.error('General error in fetch operation:', err);
          setError('Failed to load some interview data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
  
      fetchInterviews();
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <ScheduleIcon color="info" />;
      case 'in-progress':
        return <VideoCallIcon color="warning" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'cancelled':
        return <CancelIcon color="error" />;
      default:
        return <ScheduleIcon color="info" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Function to close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  // Function to delete an interview
  const handleDeleteInterview = async (interviewId, event) => {
    // Prevent the click from bubbling up to parent elements
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this interview?')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      setDeleteError('');
      
      console.log(`Attempting to delete interview with ID: ${interviewId}`);
      
      // Delete interview via API
      const response = await api.delete(`/interviews/${interviewId}`);
      console.log('Delete successful:', response.data);
      
      // Update interviews list by filtering out the deleted interview
      setInterviews(prevInterviews => 
        prevInterviews.filter(interview => interview._id !== interviewId)
      );
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Interview successfully deleted',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting interview:', error);
      
      // Show error notification with more details
      let errorMessage = 'Failed to delete interview. Please try again.';
      if (error.response) {
        // Server responded with a non-2xx status code
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      setDeleteError(errorMessage);
      setNotification({
        show: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderMyInterviews = () => {
    if (interviews.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
          }}
        >
          <VideocamOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No interviews yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first mock interview to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/interviews/create"
          >
            Create Interview
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {interviews.map((interview) => (
          <Grid item xs={12} sm={6} md={4} key={interview._id}>
            <Card className="interview-card">
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="h3" noWrap>
                    {interview.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(interview.status)}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {getStatusLabel(interview.status)}
                    </Typography>
                  </Box>
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  <strong>Industry:</strong> {interview.industry}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  <strong>Job Title:</strong> {interview.jobTitle}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  <strong>Date:</strong> {formatDate(interview.interviewDate)}
                </Typography>

                {interview.peerReviewers && interview.peerReviewers.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {interview.peerReviewers.length} peer reviewer(s)
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={interview.difficulty}
                    size="small"
                    color={
                      interview.difficulty === 'beginner'
                        ? 'success'
                        : interview.difficulty === 'intermediate'
                        ? 'primary'
                        : 'error'
                    }
                    variant="outlined"
                  />
                  {/* Delete button */}
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={(e) => handleDeleteInterview(interview._id, e)}
                    disabled={deleteLoading}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </Button>
                </Box>
              </CardContent>
              <Divider />
              <CardActions>
                <Button
                  size="small"
                  component={RouterLink}
                  to={`/interviews/${interview._id}`}
                >
                  View Details
                </Button>
                {interview.status === 'scheduled' && (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    component={RouterLink}
                    to={`/interviews/${interview._id}/session`}
                  >
                    Start Now
                  </Button>
                )}
                {interview.status === 'completed' && (
                  <Button
                    size="small"
                    color="secondary"
                    component={RouterLink}
                    to={`/interviews/${interview._id}/feedback`}
                  >
                    View Feedback
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderPeerInvitations = () => {
    if (peerInvitations.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
          }}
        >
          <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No peer review invitations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            When someone invites you to review their interview, it will appear here
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {peerInvitations.map((invitation) => (
          <Grid item xs={12} sm={6} md={4} key={invitation._id}>
            <Card className="interview-card">
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="h3" noWrap>
                    {invitation.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(invitation.status)}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {getStatusLabel(invitation.status)}
                    </Typography>
                  </Box>
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  <strong>From:</strong> {invitation.user.firstName} {invitation.user.lastName}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  <strong>Industry:</strong> {invitation.industry}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  <strong>Job Title:</strong> {invitation.jobTitle}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  <strong>Date:</strong> {formatDate(invitation.interviewDate)}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button
                  size="small"
                  component={RouterLink}
                  to={`/interviews/${invitation._id}`}
                >
                  View Details
                </Button>
                {invitation.status === 'in-progress' && (
                  <Button
                    size="small"
                    color="primary"
                    component={RouterLink}
                    to={`/interviews/${invitation._id}/session`}
                  >
                    Join Interview
                  </Button>
                )}
                {invitation.status === 'completed' && (
                  <Button
                    size="small"
                    color="secondary"
                    component={RouterLink}
                    to={`/interviews/${invitation._id}/feedback`}
                  >
                    Provide Feedback
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Handle different modes
  if (createMode) {
    return (
      <Container>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Interview
          </Typography>
          <Typography variant="body1" paragraph>
            Set up your mock interview by choosing an industry, job title, and other parameters.
          </Typography>
          
          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              This is a placeholder for the Interview Creation form
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              In the fully implemented app, this would be a multi-step form for creating a new interview.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/dashboard"
            >
              Back to Dashboard
            </Button>
          </Card>
        </Box>
      </Container>
    );
  }
  
  if (planMode) {
    return (
      <Container>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Improvement Plan
          </Typography>
          <Typography variant="body1" paragraph>
            Based on your past interviews, here's a personalized improvement plan.
          </Typography>
          
          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              This is a placeholder for the Improvement Plan
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              In the fully implemented app, this would show analytics, recommendations, and resources.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/dashboard"
            >
              Back to Dashboard
            </Button>
          </Card>
        </Box>
      </Container>
    );
  }
  
  if (profileMode) {
    return (
      <Container>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Profile
          </Typography>
          <Typography variant="body1" paragraph>
            Manage your personal information and preferences.
          </Typography>
          
          <Card sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Name:</Typography>
                <Typography variant="body1" gutterBottom>
                  {currentUser?.firstName} {currentUser?.lastName}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Email:</Typography>
                <Typography variant="body1" gutterBottom>
                  {currentUser?.email}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Profile Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  In the fully implemented app, this would include profile editing capabilities.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/dashboard"
                >
                  Back to Dashboard
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </Container>
    );
  }

  // Default dashboard view
  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {currentUser?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Prepare for your next interview with AI-powered feedback and peer collaboration.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/interviews/create"
            sx={{ mb: 3 }}
          >
            New Interview
          </Button>
          {interviews.length > 0 ? (
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to={`/improvement-plan/${interviews[0]._id}`}
              sx={{ mb: 3 }}
            >
              View Improvement Plan
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              disabled
              sx={{ mb: 3 }}
              title="Complete an interview first to view your improvement plan"
            >
              View Improvement Plan
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="interview tabs"
        >
          <Tab label="My Interviews" id="tab-0" />
          <Tab 
            label={`Peer Reviews ${peerInvitations.length > 0 ? `(${peerInvitations.length})` : ''}`} 
            id="tab-1" 
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && renderMyInterviews()}
        </Box>
      )}
      
      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && renderPeerInvitations()}
      </Box>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
