import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Toggle to use mock data or real API
const USE_MOCK_DATA = false; // Always false to use real API

// Mock user data for development
const mockUserData = {
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

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (via token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Get user profile from API
  const fetchUserProfile = async () => {
    try {
      if (USE_MOCK_DATA) {
        // For development, use mock data
        setTimeout(() => {
          setCurrentUser(mockUserData);
          setIsAuthenticated(true);
          setLoading(false);
        }, 500);
      } else {
        // Real API call to get user profile
        console.log('Fetching user profile with token:', localStorage.getItem('token'));
        const response = await api.get('/users/profile');
        console.log('User profile response:', response.data);
        
        if (response.data) {
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        } else {
          // Handle no data case
          console.error('No user data returned from profile API');
          throw new Error('Failed to get user profile data');
        }
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      
      // Check for specific error codes
      if (err.response && err.response.status === 401) {
        console.error('Authentication error - clearing session');
        logout();
      } else {
        // For other errors, keep the user logged in but show an error
        setError('Failed to load profile data, but you are still logged in');
        setIsAuthenticated(true);
        setLoading(false);
      }
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        // For development, simulate successful registration
        return new Promise((resolve) => {
          setTimeout(() => {
            // Create a mock token
            const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
            localStorage.setItem('token', mockToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
            
            // Set the current user with registration data
            const registeredUser = {
              ...mockUserData,
              name: userData.name,
              email: userData.email
            };
            
            setCurrentUser(registeredUser);
            setIsAuthenticated(true);
            setLoading(false);
            
            resolve({ success: true });
          }, 1000);
        });
      } else {
        // Extract firstName and lastName from name if provided as a single field
        const registerData = { ...userData };
        if (userData.name && !userData.firstName) {
          const nameParts = userData.name.split(' ');
          registerData.firstName = nameParts[0];
          registerData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          delete registerData.name; // Remove the name field
        }
        
        // Real API call to register user
        console.log('Sending registration data:', registerData);
        const response = await api.post('/auth/register', registerData);
        console.log('Registration response:', response.data);
        
        const { token } = response.data;
        if (!token) {
          console.error('No token received in registration response');
          throw new Error('Invalid registration response - no token');
        }
        
        console.log('Setting token in localStorage and api defaults');
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Fetching user profile after registration');
        await fetchUserProfile();
        
        // Double-check that token is properly set
        const storedToken = localStorage.getItem('token');
        console.log('Token in localStorage after registration:', storedToken ? storedToken.substring(0, 15) + '...' : 'none');
        
        return { success: true };
      }
    } catch (err) {
      console.error('Registration error details:', err);
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        // For development, simulate successful login
        return new Promise((resolve) => {
          setTimeout(() => {
            // Check mock credentials
            if (credentials.email === 'student@careerzoom.com' && credentials.password === 'student123') {
              // Create a mock token
              const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
              localStorage.setItem('token', mockToken);
              api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
              
              setCurrentUser(mockUserData);
              setIsAuthenticated(true);
              setLoading(false);
              
              resolve({ success: true });
            } else {
              setError('Invalid email or password');
              setLoading(false);
              resolve({ success: false, message: 'Invalid email or password' });
            }
          }, 1000);
        });
      } else {
        // Test API connectivity first
        try {
          console.log('Testing API connection...');
          const testResponse = await api.get('/auth/test');
          console.log('API test response:', testResponse.data);
        } catch (testError) {
          console.error('API test failed:', testError);
        }
        
        // Real API call to login
        console.log('Sending login request to API with credentials:', credentials);
        const response = await api.post('/auth/login', credentials);
        console.log('Login response:', response.data);
        
        if (response.data && response.data.token) {
          const { token } = response.data;
          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Create a basic user object from the login response
          const user = {
            _id: response.data._id,
            email: response.data.email,
            firstName: response.data.firstName || 'User',
            lastName: response.data.lastName || ''
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          setLoading(false);
          
          // Try to fetch the full profile, but continue even if it fails
          try {
            await fetchUserProfile();
          } catch (profileError) {
            console.error('Error fetching user profile after login:', profileError);
            // We've already set minimal user info, so we can continue
          }
          
          return { success: true };
        } else {
          console.error('Login response did not contain a token:', response.data);
          throw new Error('Invalid login response');
        }
      }
    } catch (err) {
      console.error('Login error details:', err);
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        // For development, simulate successful profile update
        return new Promise((resolve) => {
          setTimeout(() => {
            const updatedUser = {
              ...currentUser,
              ...profileData
            };
            
            setCurrentUser(updatedUser);
            setLoading(false);
            
            resolve({ success: true });
          }, 1000);
        });
      } else {
        // Real API call to update user profile
        const response = await api.put('/users/profile', profileData);
        setCurrentUser(response.data);
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
