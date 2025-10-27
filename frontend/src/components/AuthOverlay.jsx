import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OTPVerification from './OTPVerification';

const AuthOverlay = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  });
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // OTP verification state
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Load saved credentials if "Remember Me" was checked
      const savedEmail = localStorage.getItem('rememberedEmail');
      const savedPassword = localStorage.getItem('rememberedPassword');
      if (savedEmail && savedPassword) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          password: savedPassword
        }));
        setRememberMe(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!', { isLogin, formData });
    
    // Validate form data
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!isLogin && !formData.name) {
      setError('Please enter your full name');
      return;
    }
    
    if (!isLogin && !formData.username) {
      setError('Please choose a username');
      return;
    }
    
    if (!isLogin && usernameError) {
      setError(usernameError);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      console.log('Making request to:', `http://localhost:5000${endpoint}`, formData);
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData);

      if (isLogin) {
        // Handle login
        if (response.data.token) {
          // Store token in localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Save credentials if "Remember Me" is checked
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', formData.email);
            localStorage.setItem('rememberedPassword', formData.password);
          } else {
            // Clear saved credentials if "Remember Me" is unchecked
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
          }
          
          setSuccess('Login successful!');
          
          // Close overlay and notify parent component
          setTimeout(() => {
            onLoginSuccess(response.data.user);
            onClose();
          }, 1500);
        }
      } else {
        // Handle registration
        if (response.data.userId) {
          setSuccess(response.data.message || 'Registration successful! Please check your email for verification code.');
          
          // Show OTP verification overlay
          setPendingUserId(response.data.userId);
          setPendingEmail(formData.email);
          setShowOTPVerification(true);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: formData.email
      });
      
      setSuccess('Password reset link sent to your email!');
      setTimeout(() => {
        setShowForgotPassword(false);
        setFormData({ email: '', password: '', name: '' });
        // Clear saved credentials when requesting password reset
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', name: '' });
    setShowForgotPassword(false);
    setRememberMe(false);
  };

  const handleVerificationSuccess = () => {
    console.log('OTP verification successful, attempting auto-login...');
    
    // After successful verification, login the user automatically
    const loginData = {
      email: pendingEmail,
      password: formData.password
    };

    setIsLoading(true);
    
    axios.post('http://localhost:5000/api/auth/login', loginData)
      .then(response => {
        console.log('Auto-login successful:', response.data);
        
        if (response.data.token) {
          // Store authentication data
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Save credentials if "Remember Me" was checked during registration
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', pendingEmail);
            localStorage.setItem('rememberedPassword', formData.password);
          }
          
          setSuccess('Account verified successfully! Redirecting to feed...');
          
          // Close OTP modal and redirect to feed
          setShowOTPVerification(false);
          
          setTimeout(() => {
            onLoginSuccess(response.data.user);
            onClose();
          }, 1500);
        }
      })
      .catch(error => {
        console.error('Auto-login failed:', error);
        setError('Verification successful, but auto-login failed. Please login manually.');
        setShowOTPVerification(false);
        setIsLogin(true); // Switch to login mode
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      {/* Simple Clean Login Form */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-500 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-4 opacity-0 scale-95'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {showForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-gray-600">
            {showForgotPassword 
              ? 'Enter your email to receive a reset link'
              : (isLogin ? 'Sign in to your account' : 'Join our community')
            }
          </p>
        </div>

        {/* Google Login Button */}
        {!showForgotPassword && (
          <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* Divider */}
        {!showForgotPassword && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
          {!isLogin && !showForgotPassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={async (e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setFormData(prev => ({ ...prev, username: value }));
                    
                    if (value && value.length >= 3) {
                      setUsernameChecking(true);
                      try {
                        const response = await axios.get(`http://localhost:5000/api/users/check-username-public/${value}`);
                        setUsernameError(response.data.available ? '' : 'Username already taken');
                      } catch (error) {
                        setUsernameError('');
                      }
                      setUsernameChecking(false);
                    } else if (value.length > 0 && value.length < 3) {
                      setUsernameError('Username must be at least 3 characters');
                    } else {
                      setUsernameError('');
                    }
                  }}
                  required={!isLogin}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
                    usernameError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Choose a username"
                  minLength={3}
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                  </div>
                )}
                {usernameError && (
                  <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                )}
                {!usernameError && formData.username && formData.username.length >= 3 && !usernameChecking && (
                  <p className="text-xs text-green-500 mt-1">✓ Username available</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>

          {!showForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>
          )}

          {/* Remember Me Checkbox */}
          {isLogin && !showForgotPassword && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
            </div>
          )}

          {/* Forgot Password Link */}
          {isLogin && !showForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLoading ? 'Processing...' : (showForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Sign Up'))}
              </div>
            ) : (
              showForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Sign Up')
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        {!showForgotPassword && (
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

        {/* Back to Login (for forgot password) */}
        {showForgotPassword && (
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setSuccess('');
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>

      {/* OTP Verification Overlay */}
      <OTPVerification
        isOpen={showOTPVerification}
        onClose={() => setShowOTPVerification(false)}
        userId={pendingUserId}
        email={pendingEmail}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default AuthOverlay; 