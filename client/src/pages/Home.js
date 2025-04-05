import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
} from '@mui/material';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import { useContext } from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          borderRadius: { xs: 0, sm: 2 },
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Ace Your Next Interview with AI-Powered Practice
              </Typography>
              <Typography variant="h5" paragraph>
                Prepare for the modern virtual interview landscape with real-time feedback and analytics
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/interviews/create"
                  >
                    Create Mock Interview
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      component={RouterLink}
                      to="/register"
                    >
                      Sign Up Free
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      component={RouterLink}
                      to="/login"
                    >
                      Login
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Placeholder for hero image */}
              <Box
                sx={{
                  height: 300,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonalVideoIcon sx={{ fontSize: 100, opacity: 0.7 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Key Features
        </Typography>

        <Grid container spacing={4}>
          {/* Feature 1 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <VideoCameraFrontIcon
                  color="primary"
                  sx={{ fontSize: 60, mb: 2 }}
                />
                <Typography variant="h5" component="h3" gutterBottom>
                  AI-Powered Interview Simulation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Realistic interview environments with industry-specific questions tailored to specific job roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <AnalyticsIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Comprehensive Feedback System
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Analysis of verbal and non-verbal communication including tone, confidence, pacing, and body language
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Collaborative Learning
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Peer-review breakout rooms where students can observe and provide feedback to each other
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8, mb: 6 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            How It Works
          </Typography>

          <Grid container spacing={2}>
            {/* Step 1 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">1</Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Select Your Industry
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from a wide range of industries and job roles
                </Typography>
              </Box>
            </Grid>

            {/* Step 2 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">2</Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Schedule Your Interview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set up a convenient time for your mock interview session
                </Typography>
              </Box>
            </Grid>

            {/* Step 3 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">3</Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Practice with AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participate in a realistic Zoom interview with AI-generated questions
                </Typography>
              </Box>
            </Grid>

            {/* Step 4 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">4</Typography>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Get Detailed Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive comprehensive analysis and personalized improvement plan
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to={isAuthenticated ? '/dashboard' : '/register'}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Testimonials or additional content would go here */}
    </Box>
  );
};

export default Home;
