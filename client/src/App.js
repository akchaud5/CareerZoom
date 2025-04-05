import React, { useState, createContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import TestHome from './pages/TestHome';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewCreate from './pages/InterviewCreate';
import InterviewDetail from './pages/InterviewDetail';
import InterviewSession from './pages/InterviewSession';
import FeedbackDetail from './pages/FeedbackDetail';
import ImprovementPlan from './pages/ImprovementPlan';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';

// Create a user settings context
export const UserSettingsContext = createContext({
  userSettings: {
    darkMode: false,
    notifications: true,
    accessibility: { fontSize: 'medium', highContrast: false }
  },
  updateSettings: () => {}
});

// Simple theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading spinner if still checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login with a return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function App() {
  // State for user settings
  const [userSettings, setUserSettings] = useState({
    darkMode: false,
    notifications: true,
    accessibility: { fontSize: 'medium', highContrast: false }
  });
  
  // Function to update user settings
  const updateSettings = (newSettings) => {
    setUserSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  return (
    <UserSettingsContext.Provider value={{ userSettings, updateSettings }}>
      <AuthProvider>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="app">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/interviews/create" 
                    element={
                      <ProtectedRoute>
                        <InterviewCreate />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/interviews/:id" 
                    element={
                      <ProtectedRoute>
                        <InterviewDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/interviews/:id/session" 
                    element={
                      <ProtectedRoute>
                        <InterviewSession />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/interviews/:id/feedback" 
                    element={
                      <ProtectedRoute>
                        <FeedbackDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/improvement-plan/:id" 
                    element={
                      <ProtectedRoute>
                        <ImprovementPlan />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </StyledEngineProvider>
      </AuthProvider>
    </UserSettingsContext.Provider>
  );
}

export default App;