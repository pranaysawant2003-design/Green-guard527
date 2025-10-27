import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Page Components
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ResetPassword from './components/ResetPassword';
import TestFollow from './components/TestFollow';
import AdoptionHub from './components/AdoptionHub.jsx';
import ListPlant from './pages/ListPlant.jsx';
import DetectPage from './pages/DetectPage.jsx';
import AdoptionMapPage from './pages/AdoptionMapPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:5000';
// Ensure Authorization header is set globally if token exists
const _bootToken = localStorage.getItem('token');
if (_bootToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${_bootToken}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('App.jsx - checkAuth called with:', { token: !!token, userData: !!userData });
      
      if (token && userData) {
        try {
          // Set default auth header before making any API calls
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('App.jsx - Making request to /api/users/me');
          const response = await axios.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('App.jsx - User data fetched:', response.data.user);
          console.log('App.jsx - User username:', response.data.user.username);
          console.log('App.jsx - User email:', response.data.user.email);
          console.log('App.jsx - User name:', response.data.user.name);
          
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          console.error('Auth error response:', error.response?.data);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Clear remembered credentials when auth check fails
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          setUser(null);
        }
      } else {
        console.log('App.jsx - No token or userData, setting user to null');
        setUser(null);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/feed" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          } />
          <Route path="/plants" element={
            <ProtectedRoute>
              <AdoptionHub />
            </ProtectedRoute>
          } />
          <Route path="/detect" element={
            <ProtectedRoute>
              <DetectPage />
            </ProtectedRoute>
          } />
          
          <Route path="/adoption-map" element={
            <ProtectedRoute>
              <AdoptionMapPage />
            </ProtectedRoute>
          } />
          
          {/* Messages routes */}
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/messages/:username" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          
          {/* Profile routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Navigate to="/profile/me" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/me" element={
            <ProtectedRoute>
              <ProfilePage isOwnProfile={true} />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/test-follow" element={
            <ProtectedRoute>
              <TestFollow />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
