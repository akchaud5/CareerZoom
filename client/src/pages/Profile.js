import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Paper, TextField, 
  Avatar, Grid, Divider, CircularProgress, Alert, Snackbar,
  FormControlLabel, Switch
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Mock user data for development
const mockUser = {
  id: "123",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  bio: "Senior software engineer with 8 years of experience in full-stack development. Passionate about clean code and user experience. Currently looking for new opportunities in the tech industry.",
  linkedInUrl: "https://linkedin.com/in/alexjohnson",
  gitHubUrl: "https://github.com/alexjohnson",
  avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  preferences: {
    receiveNotifications: true,
    publicProfile: false
  }
};

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    bio: '',
    linkedInUrl: '',
    gitHubUrl: '',
    preferences: {
      receiveNotifications: true,
      publicProfile: false
    }
  });

  useEffect(() => {
    console.log('Current user data in Profile:', currentUser);
    
    // Use real user data if available, otherwise fall back to mock data
    const userData = currentUser || mockUser;
    
    // Extract LinkedIn and GitHub URLs from jobTitles if present
    let linkedInUrl = '';
    let gitHubUrl = '';
    
    if (userData.jobTitles && Array.isArray(userData.jobTitles)) {
      userData.jobTitles.forEach(title => {
        if (title.startsWith('LinkedIn:')) {
          linkedInUrl = title.replace('LinkedIn:', '').trim();
        } else if (title.startsWith('GitHub:')) {
          gitHubUrl = title.replace('GitHub:', '').trim();
        }
      });
    }
    
    // Get bio from industries array if present
    const bio = userData.industries && userData.industries.length > 0 
      ? userData.industries[0]
      : userData.bio || '';
    
    setFormData({
      name: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.name || '',
      email: userData.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      bio: bio,
      linkedInUrl: linkedInUrl || userData.linkedInUrl || '',
      gitHubUrl: gitHubUrl || userData.gitHubUrl || '',
      preferences: {
        receiveNotifications: true,
        publicProfile: userData.role === 'mentor'
      }
    });
    
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: checked
        }
      });
    }
  };
  
  // Handler for profile picture upload
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Upload file with progress tracking
      const response = await api.post('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Update user context with new profile picture URL
      if (response.data && response.data.profilePicture) {
        const updatedUser = {
          ...currentUser,
          profilePicture: response.data.profilePicture
        };
        
        // Update context with the new user data
        await updateProfile({ profilePicture: response.data.profilePicture });
        
        // Show success notification
        setSuccess(true);
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate passwords if trying to change them
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        
        if (!formData.currentPassword) {
          throw new Error('Current password is required to set a new password');
        }
      }
      
      // Extract first and last name from the name field
      let firstName, lastName;
      if (formData.name) {
        const nameParts = formData.name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Prepare data for API - match the fields in the User model
      const updatedUserData = {
        firstName: firstName || currentUser?.firstName,
        lastName: lastName || currentUser?.lastName,
        // Use industries array for professional info
        industries: formData.bio ? [formData.bio] : currentUser?.industries || [],
        // Store URLs in jobTitles array for now
        jobTitles: [
          formData.linkedInUrl && `LinkedIn: ${formData.linkedInUrl}`,
          formData.gitHubUrl && `GitHub: ${formData.gitHubUrl}`
        ].filter(Boolean) // Remove empty entries
      };
      
      // Add password data if changing password
      if (formData.newPassword && formData.currentPassword) {
        updatedUserData.currentPassword = formData.currentPassword;
        updatedUserData.newPassword = formData.newPassword;
      }
      
      console.log('Updating profile with data:', updatedUserData);
      
      // Use the updateProfile function from AuthContext
      const result = await updateProfile(updatedUserData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }
      
      setSuccess(true);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('Profile updated successfully');
    } catch (err) {
      const errorMessage = 
        (err.response && err.response.data && err.response.data.message) 
          ? err.response.data.message 
          : (err.message || 'Failed to update profile');
          
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar 
              src={currentUser?.profilePicture || mockUser.avatarUrl} 
              alt={currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : mockUser.name} 
              sx={{ width: 80, height: 80, mr: 3 }}
            />
            {isUploading && (
              <CircularProgress
                variant="determinate"
                value={uploadProgress}
                size={80}
                thickness={2}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: 'primary.main',
                }}
              />
            )}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-picture-upload"
              type="file"
              onChange={(e) => handleProfilePictureUpload(e)}
              disabled={isUploading}
            />
            <label htmlFor="profile-picture-upload">
              <Button 
                component="span" 
                variant="contained" 
                color="primary" 
                size="small"
                disabled={isUploading}
                sx={{ 
                  position: 'absolute', 
                  bottom: -10, 
                  right: 12,
                  minWidth: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%'
                }}
              >
                {isUploading ? '...' : '+'}
              </Button>
            </label>
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your personal information and preferences
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                disabled
                margin="normal"
                helperText="Email cannot be changed"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
                placeholder="Tell others about yourself, your career goals, or expertise"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                name="linkedInUrl"
                value={formData.linkedInUrl}
                onChange={handleChange}
                margin="normal"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GitHub URL"
                name="gitHubUrl"
                value={formData.gitHubUrl}
                onChange={handleChange}
                margin="normal"
                placeholder="https://github.com/yourusername"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Change Password
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.preferences.receiveNotifications}
                      onChange={handleSwitchChange}
                      name="preferences.receiveNotifications"
                      color="primary"
                    />
                  }
                  label="Receive email notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.preferences.publicProfile}
                      onChange={handleSwitchChange}
                      name="preferences.publicProfile"
                      color="primary"
                    />
                  }
                  label="Make profile visible to recruiters"
                />
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={() => setSuccess(false)}
        message="Profile updated successfully"
      />
    </Container>
  );
};

export default Profile;