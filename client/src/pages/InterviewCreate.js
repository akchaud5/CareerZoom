import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const initialFormState = {
  title: '',
  description: '',
  industry: '',
  jobTitle: '',
  difficulty: 'intermediate',
  duration: 30,
  interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  useVoiceOver: false,
  voiceType: 'alloy'
};

// Mock industry and job title data
const mockIndustries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Sales',
  'Customer Service',
  'Manufacturing'
];

const mockJobTitlesByIndustry = {
  'Technology': ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager'],
  'Healthcare': ['Nurse', 'Doctor', 'Medical Assistant', 'Healthcare Administrator', 'Physical Therapist'],
  'Finance': ['Financial Analyst', 'Accountant', 'Investment Banker', 'Financial Advisor', 'Loan Officer'],
  'Education': ['Teacher', 'Principal', 'School Counselor', 'Education Administrator', 'Professor'],
  'Marketing': ['Marketing Manager', 'Digital Marketing Specialist', 'Content Strategist', 'Brand Manager', 'SEO Specialist'],
  'Sales': ['Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager'],
  'Customer Service': ['Customer Service Representative', 'Customer Success Manager', 'Support Specialist'],
  'Manufacturing': ['Production Manager', 'Quality Control Specialist', 'Plant Manager', 'Manufacturing Engineer']
};

// Mock voice types
const mockVoices = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral' },
  { id: 'nova', name: 'Nova', description: 'Female' },
  { id: 'shimmer', name: 'Shimmer', description: 'Male' },
  { id: 'echo', name: 'Echo', description: 'Male, deep' },
  { id: 'fable', name: 'Fable', description: 'Female, soft' }
];

// Mock questions
const generateMockQuestions = (industry, jobTitle, difficulty) => {
  const baseQuestions = [
    { text: 'Tell me about yourself and your experience in this field.' },
    { text: 'What are your strengths and weaknesses?' },
    { text: 'Why do you want to work for our company?' },
    { text: 'Where do you see yourself in 5 years?' },
    { text: 'Describe a challenging situation you faced at work and how you handled it.' }
  ];
  
  const techQuestions = [
    { text: 'Explain the difference between var, let, and const in JavaScript.' },
    { text: 'What is the virtual DOM in React and why is it important?' },
    { text: 'Describe the box model in CSS.' },
    { text: 'What is a RESTful API?' },
    { text: 'Explain the concept of responsive design.' }
  ];
  
  const financeQuestions = [
    { text: 'What are the key financial statements and what do they tell us?' },
    { text: 'Explain the difference between FIFO and LIFO inventory methods.' },
    { text: 'What is the time value of money?' },
    { text: 'How do you evaluate the financial health of a company?' },
    { text: 'What factors affect interest rates?' }
  ];
  
  if (industry === 'Technology') {
    return [...baseQuestions, ...techQuestions];
  } else if (industry === 'Finance') {
    return [...baseQuestions, ...financeQuestions];
  } else {
    return baseQuestions;
  }
};

const InterviewCreate = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [industries, setIndustries] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const navigate = useNavigate();

  // Load data from API
  useEffect(() => {
    // Load industries
    const fetchIndustries = async () => {
      setIndustryLoading(true);
      try {
        const response = await api.get('/questions/industries');
        setIndustries(response.data);
      } catch (error) {
        console.error('Error fetching industries:', error);
        // Fallback to mock data if API fails
        setIndustries(mockIndustries);
      } finally {
        setIndustryLoading(false);
      }
    };
    
    // Load voices
    const fetchVoices = async () => {
      setVoicesLoading(true);
      try {
        const response = await api.get('/voices');
        setVoices(response.data);
      } catch (error) {
        console.error('Error fetching voices:', error);
        // Fallback to mock data if API fails
        setVoices(mockVoices);
      } finally {
        setVoicesLoading(false);
      }
    };
    
    fetchIndustries();
    fetchVoices();
  }, []);

  // Update job titles when industry changes
  useEffect(() => {
    if (!formData.industry) {
      setJobTitles([]);
      return;
    }

    // Fetch job titles from API for the selected industry
    const fetchJobTitles = async () => {
      try {
        // We'll try to get job titles from the questions API by industry
        const response = await api.get(`/questions/industry/${formData.industry}`);
        
        // Extract unique job titles from questions
        const uniqueJobTitles = [...new Set(response.data.map(q => q.jobTitle))];
        setJobTitles(uniqueJobTitles);
      } catch (error) {
        console.error('Error fetching job titles:', error);
        // Fallback to mock data if API fails
        const selectedJobTitles = mockJobTitlesByIndustry[formData.industry] || [];
        setJobTitles(selectedJobTitles);
      }
    };
    
    fetchJobTitles();
  }, [formData.industry]);

  // Update questions when job title or difficulty changes
  useEffect(() => {
    if (!formData.industry || !formData.jobTitle) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        // Get questions filtered by industry, job title, and difficulty
        const response = await api.get(`/questions/industry/${formData.industry}`, {
          params: {
            jobTitle: formData.jobTitle,
            difficulty: formData.difficulty
          }
        });
        
        setQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
        // Fallback to mock data if API fails
        const generatedQuestions = generateMockQuestions(formData.industry, formData.jobTitle, formData.difficulty);
        setQuestions(generatedQuestions);
      } finally {
        setQuestionsLoading(false);
      }
    };
    
    fetchQuestions();
  }, [formData.industry, formData.jobTitle, formData.difficulty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      interviewDate: newDate,
    });

    // Clear date error
    if (errors.interviewDate) {
      setErrors({
        ...errors,
        interviewDate: '',
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Validate basic information
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }

      if (!formData.industry) {
        newErrors.industry = 'Industry is required';
      }

      if (!formData.jobTitle) {
        newErrors.jobTitle = 'Job title is required';
      }
    } else if (step === 1) {
      // Validate scheduling information
      if (!formData.interviewDate) {
        newErrors.interviewDate = 'Interview date is required';
      } else if (formData.interviewDate < new Date()) {
        newErrors.interviewDate = 'Interview date must be in the future';
      }

      if (!formData.duration || formData.duration < 15) {
        newErrors.duration = 'Duration must be at least 15 minutes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError('');

      // Log form data for debugging
      console.log('Submitting interview with form data:', formData);
      
      // If interviewDate is a Date object, convert to ISO string
      const submitData = {
        ...formData
      };
      
      if (submitData.interviewDate instanceof Date) {
        submitData.interviewDate = submitData.interviewDate.toISOString();
      }
      
      // Ensure questions is an array of IDs or empty array
      if (!Array.isArray(submitData.questions)) {
        submitData.questions = [];
      }
      
      // Submit interview data to API with modified data
      console.log('Sending to API:', submitData);
      const response = await api.post('/interviews', submitData);
      console.log('API response:', response.data);
      
      setSubmitSuccess(true);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Error creating interview:', error);
      // Show detailed error if available
      if (error.response?.data?.error) {
        console.error('Server error details:', error.response.data.error);
      }
      const message = error.response?.data?.message || 'Failed to create interview. Please try again.';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Basic Information', 'Scheduling', 'Review'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Interview Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Add details about this mock interview session"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.industry}>
                  <InputLabel id="industry-label">Industry</InputLabel>
                  <Select
                    labelId="industry-label"
                    name="industry"
                    value={formData.industry}
                    label="Industry"
                    onChange={handleChange}
                    disabled={industryLoading}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry} value={industry}>
                        {industry}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.jobTitle}>
                  <InputLabel id="job-title-label">Job Title</InputLabel>
                  <Select
                    labelId="job-title-label"
                    name="jobTitle"
                    value={formData.jobTitle}
                    label="Job Title"
                    onChange={handleChange}
                    disabled={!formData.industry}
                  >
                    {jobTitles.map((title) => (
                      <MenuItem key={title} value={title}>
                        {title}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.jobTitle && <FormHelperText>{errors.jobTitle}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficulty Level</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    name="difficulty"
                    value={formData.difficulty}
                    label="Difficulty Level"
                    onChange={handleChange}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Interview Date and Time"
                  name="interviewDate"
                  type="datetime-local"
                  value={formData.interviewDate ? new Date(formData.interviewDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    handleDateChange(new Date(e.target.value));
                  }}
                  error={!!errors.interviewDate}
                  helperText={errors.interviewDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  error={!!errors.duration}
                  helperText={errors.duration || 'Minimum 15 minutes'}
                  InputProps={{ inputProps: { min: 15, max: 120 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Voice-Over Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.useVoiceOver}
                            onChange={handleSwitchChange}
                            name="useVoiceOver"
                            color="primary"
                          />
                        }
                        label="Enable automatic question voice-over"
                      />
                      <Typography variant="body2" color="text.secondary">
                        When enabled, interview questions will be read aloud using AI-generated voice
                      </Typography>
                    </Grid>
                    
                    {formData.useVoiceOver && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="voice-type-label">Voice Type</InputLabel>
                          <Select
                            labelId="voice-type-label"
                            name="voiceType"
                            value={formData.voiceType}
                            label="Voice Type"
                            onChange={handleChange}
                            disabled={voicesLoading}
                          >
                            {voices.map((voice) => (
                              <MenuItem key={voice.id} value={voice.id}>
                                {voice.name} - {voice.description}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Preview of Questions
              </Typography>

              {questionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : questions.length > 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sample questions from a pool of {questions.length} questions:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {questions.slice(0, 5).map((question, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">{question.text}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              ) : (
                <Alert severity="info">
                  No questions available for the selected criteria. Please try a different industry,
                  job title, or difficulty level.
                </Alert>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Interview Details
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.title}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Difficulty
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {formData.difficulty}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Industry
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.industry}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job Title
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.jobTitle}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date and Time
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.interviewDate?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.duration} minutes
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Voice-Over
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.useVoiceOver ? `Enabled (${voices.find(v => v.id === formData.voiceType)?.name || formData.voiceType})` : 'Disabled'}
                  </Typography>
                </Grid>

                {formData.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formData.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Typography variant="body2" color="text.secondary" paragraph>
              By clicking "Create Interview", a Zoom meeting will be automatically created and
              scheduled for the selected date and time. You'll receive the meeting details and will be
              able to invite peer reviewers after creation.
            </Typography>

            {submitError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            {submitSuccess && (
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                Interview created successfully! You will be redirected to the dashboard.
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Create Mock Interview
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>

        <Box>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || submitSuccess}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Interview'}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default InterviewCreate;