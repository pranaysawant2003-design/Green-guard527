import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthOverlay from './AuthOverlay';

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Notifications response:', response.data);
      console.log('Notifications array:', response.data.notifications);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const handleNotificationClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear remembered credentials on logout
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    setUser(null);
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowAuthOverlay(false);
    navigate('/feed');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/feed', label: 'My Feed', icon: '🏠' },
    { path: '/explore', label: 'Explore', icon: '🔍' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/adoption-map', label: 'Adoption Map', icon: '🗺️' },
    { path: '/plants', label: 'Plants', icon: '🌿' },
    { path: '/detect', label: 'Detect', icon: '🔬' }
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl">🌱</div>
            <span className="text-xl font-bold text-green-800">GreenGuard</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-gray-600">No notifications yet</p>
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notification) => {
                          const getNotificationContent = (notif) => {
                            switch (notif.type) {
                              case 'like':
                                return {
                                  icon: '❤️',
                                  text: 'liked your post',
                                  link: `/feed?post=${notif.post?._id}`,
                                  color: 'text-red-500'
                                };
                              case 'comment':
                                return {
                                  icon: '💬',
                                  text: 'commented on your post',
                                  link: `/feed?post=${notif.post?._id}`,
                                  color: 'text-blue-500'
                                };
                              case 'adoption_request':
                                return {
                                  icon: '🌱',
                                  text: 'requested to adopt your plant',
                                  link: `/plants?tab=incoming`,
                                  color: 'text-green-500',
                                  highlight: true
                                };
                              case 'adoption_accepted':
                                return {
                                  icon: '🎉',
                                  text: 'accepted your adoption request!',
                                  link: `/messages/${notif.actor?.username}`,
                                  color: 'text-emerald-500',
                                  highlight: true
                                };
                              case 'adoption_rejected':
                                return {
                                  icon: '💔',
                                  text: 'declined your adoption request',
                                  link: `/messages/${notif.actor?.username}`,
                                  color: 'text-gray-500'
                                };
                              case 'follow':
                                return {
                                  icon: '👤',
                                  text: 'started following you',
                                  link: `/profile/${notif.actor?.username}`,
                                  color: 'text-purple-500'
                                };
                              default:
                                return {
                                  icon: '🔔',
                                  text: 'sent you a notification',
                                  link: '/feed',
                                  color: 'text-gray-500'
                                };
                            }
                          };

                          const content = getNotificationContent(notification);

                          return (
                            <button
                              key={notification._id}
                              onClick={() => {
                                markAsRead(notification._id);
                                navigate(content.link);
                                setShowNotifications(false);
                              }}
                              className={`w-full p-4 hover:bg-gray-50 transition border-b border-gray-100 text-left ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              } ${content.highlight ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500' : ''}`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {notification.actor?.name?.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900">
                                    <span className="font-semibold">{notification.actor?.name}</span>{' '}
                                    <span className="text-gray-600">{content.text}</span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                                <span className={`text-xl ${content.color}`}>{content.icon}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-green-800">
                    {user.name || user.email}
                  </span>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile/me"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthOverlay(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center space-x-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Auth Overlay */}
      <AuthOverlay
        isOpen={showAuthOverlay}
        onClose={() => setShowAuthOverlay(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </nav>
  );
};

export default Navigation;
