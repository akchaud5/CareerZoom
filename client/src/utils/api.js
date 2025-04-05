import axios from 'axios';

// Print the API base URL for debugging
console.log('API base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

// Create the axios instance with proper configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Disable withCredentials for now
  withCredentials: false
});

// Add the token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('Initialized API with token from localStorage');
}

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Request to ${config.url} with token: ${token.substring(0, 15)}...`);
    } else {
      console.warn(`No auth token found for request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If 401 response, clear auth and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
