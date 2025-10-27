import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from './PostCard';

const Profile = ({ isOwnProfile = false }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfileState, setIsOwnProfileState] = useState(isOwnProfile);
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: ''
  });
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [uploadingPfp, setUploadingPfp] = useState(false);

  console.log('Profile component loaded with:', { username, isOwnProfile });

  useEffect(() => {
    console.log('Profile useEffect triggered with:', { username, isOwnProfile });
    console.log('Current URL params:', window.location.pathname);
    fetchUserProfile();
  }, [username, isOwnProfile]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Profile fetchUserProfile called with token:', !!token);
      
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      let response;
      
      // If it's the current user's profile or username is 'me', use /api/users/me
      if (isOwnProfile || username === 'me' || !username) {
        console.log('Fetching current user profile...');
        console.log('Making request to /api/users/me');
        
        response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userData = response.data.user;
        console.log('Current user data:', userData);
        console.log('User has username:', !!userData.username);
        console.log('User username value:', userData.username);
        
        setUser(userData);
        setIsOwnProfileState(true);
        
        // Fetch current user's posts
        try {
          console.log('Fetching user posts...');
          console.log('User ID for posts:', userData._id);
          
          const postsResponse = await axios.get('/api/posts/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Current user posts response:', postsResponse.data);
          console.log('Current user posts:', postsResponse.data.posts);
          console.log('Posts count:', postsResponse.data.posts.length);
          
          // Check if posts have proper author data
          if (postsResponse.data.posts.length > 0) {
            console.log('First post author:', postsResponse.data.posts[0].author);
            console.log('First post plant data:', postsResponse.data.posts[0].plantData);
          }
          
          setPosts(postsResponse.data.posts || []);
        } catch (postsError) {
          console.error('Error fetching user posts:', postsError);
          console.error('Posts error response:', postsError.response?.data);
          console.error('Posts error status:', postsError.response?.status);
          setPosts([]);
        }
      } else {
        // Fetch other user's profile by username
        console.log('Fetching other user profile for username:', username);
        console.log('Making request to /api/users/profile/' + username);
        
        response = await axios.get(`/api/users/profile/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Other user data:', response.data.user);
        setUser(response.data.user);
        setPosts(response.data.user.posts || []);
        setIsOwnProfileState(false);
        
        // Check if following this user
        if (token) {
          try {
            const currentUserResponse = await axios.get('/api/users/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const currentUser = currentUserResponse.data.user;
            setIsFollowing(currentUser.following && currentUser.following.includes(response.data.user._id));
          } catch (followError) {
            console.error('Error checking follow status:', followError);
            setIsFollowing(false);
          }
        }
      }

      // Set edit form data
      if (response.data.user) {
        setEditForm({
          name: response.data.user.name || '',
          username: response.data.user.username || '',
          bio: response.data.user.bio || '',
          location: response.data.user.location || '',
          website: response.data.user.website || ''
        });
      }

      console.log('Profile fetch completed successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/users/${user._id}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsFollowing(response.data.isFollowing);
      setUser(prev => ({
        ...prev,
        followerCount: response.data.followerCount
      }));
      
      // Show success message
      console.log(response.data.message);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleEditProfile = async () => {
    // Prevent saving if there's a username error
    if (usernameError) {
      alert('Please fix the username error before saving');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/users/profile', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(prev => ({ ...prev, ...response.data.user }));
      setEditMode(false);
      
      // If username was changed, update URL
      if (response.data.user.username !== username) {
        navigate(`/profile/${response.data.user.username}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.get(`/api/users/${user._id}/followers`);
      setFollowers(response.data.followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await axios.get(`/api/users/${user._id}/following`);
      setFollowing(response.data.following);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user?.username) return;
    
    try {
      setLoadingLiked(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/posts/liked/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLikedPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      setLoadingLiked(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update posts in Posts tab
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, likeCount: response.data.likeCount, isLiked: response.data.isLiked }
          : post
      ));
      
      // Update liked posts tab
      setLikedPosts(prev => {
        if (response.data.isLiked) {
          // Post was liked, keep it in the list
          return prev.map(post => 
            post._id === postId 
              ? { ...post, likeCount: response.data.likeCount, isLiked: true }
              : post
          );
        } else {
          // Post was unliked, remove it from liked list
          return prev.filter(post => post._id !== postId);
        }
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/posts/${postId}/comment`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, response.data.comment] }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }

    setUploadingPfp(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post('/api/users/upload-pfp', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update user state with new profile picture
      setUser(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.profilePicture = response.data.profilePicture;
      localStorage.setItem('user', JSON.stringify(storedUser));

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingPfp(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/blocked', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Fetch blocked users error:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user? You will no longer see their posts and they cannot message you.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User blocked successfully');
      
      // If viewing another user's profile, navigate away
      if (!isOwnProfileState) {
        navigate('/feed');
      } else {
        // If in settings modal, refresh blocked users list
        fetchBlockedUsers();
      }
    } catch (error) {
      console.error('Block user error:', error);
      alert(error.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/${userId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User unblocked successfully');
      fetchBlockedUsers();
    } catch (error) {
      console.error('Unblock user error:', error);
      alert(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('User is null, showing error state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-in fadeInUp duration-500">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">User not found</h2>
          <p className="text-gray-500">This plant enthusiast doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/feed')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  // Ensure user has required fields
  const displayName = user.name || 'Unknown User';
  const displayUsername = user.username || user.email || 'unknown';
  const displayBio = user.bio || '';
  const displayLocation = user.location || '';
  const displayWebsite = user.website || '';
  
  // Add backend URL to profile picture if it exists
  const displayProfilePicture = user.profilePicture 
    ? (user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `http://localhost:5000${user.profilePicture}`)
    : '';
    
  const displayFollowerCount = user.followers?.length || user.followerCount || 0;
  const displayFollowingCount = user.following?.length || user.followingCount || 0;
  const displayPostCount = posts.length; // Use actual posts array length for accuracy

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header - Instagram Style with Lighter Colors */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative group">
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={!isOwnProfileState || uploadingPfp}
              />
              <label 
                htmlFor={isOwnProfileState ? "profilePictureInput" : undefined}
                className={`block ${isOwnProfileState ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg relative">
                  {uploadingPfp && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  {displayProfilePicture ? (
                    <img
                      src={displayProfilePicture}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {isOwnProfileState && !uploadingPfp && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-medium">Change Photo</span>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {displayName}
                </h1>
                {user.isVerified && (
                  <span className="text-blue-500 text-xl" title="Verified">✓</span>
                )}
                {isOwnProfileState && (
                  <>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="Edit Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(!showSettings);
                        if (!showSettings) fetchBlockedUsers();
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="Settings"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              <p className="text-gray-600 mb-3">@{displayUsername}</p>
              
              {/* Edit Form */}
              {editMode && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 animate-in slideInUp duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={async (e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setEditForm(prev => ({ ...prev, username: value }));
                          
                          if (value && value !== user?.username) {
                            setUsernameChecking(true);
                            try {
                              const token = localStorage.getItem('token');
                              const response = await axios.get(`/api/users/check-username/${value}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              setUsernameError(response.data.available ? '' : 'Username already taken');
                            } catch (error) {
                              setUsernameError('');
                            }
                            setUsernameChecking(false);
                          } else {
                            setUsernameError('');
                          }
                        }}
                        placeholder="Username"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          usernameError 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {usernameChecking && (
                        <div className="absolute right-3 top-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                      {usernameError && (
                        <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                      )}
                      {!usernameError && editForm.username && editForm.username !== user?.username && (
                        <p className="text-xs text-green-500 mt-1">✓ Username available</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and underscores</p>
                    </div>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Bio"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleEditProfile}
                      disabled={usernameError || usernameChecking}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        usernameError || usernameChecking
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {usernameChecking ? 'Checking...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {displayBio && !editMode && (
                <p className="text-gray-800 mb-3 max-w-md">{displayBio}</p>
              )}
              
              {/* User Stats */}
              <div className="flex items-center space-x-8 text-sm mb-4">
                <button
                  onClick={() => {
                    fetchFollowers();
                    setShowFollowers(true);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <span className="font-semibold text-gray-900">{displayFollowerCount}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </button>
                <button
                  onClick={() => {
                    fetchFollowing();
                    setShowFollowing(true);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <span className="font-semibold text-gray-900">{displayFollowingCount}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </button>
                <div>
                  <span className="font-semibold text-gray-900">{displayPostCount}</span>
                  <span className="text-gray-600 ml-1">posts</span>
                </div>
              </div>

              {/* Location and Website */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {displayLocation && (
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{displayLocation}</span>
                  </div>
                )}
                {displayWebsite && (
                  <div className="flex items-center space-x-1">
                    <span>🔗</span>
                    <a
                      href={displayWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {displayWebsite}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {isOwnProfileState ? (
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isFollowing
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${user?.username}`)}
                    className="flex items-center justify-center space-x-2 px-6 py-2 rounded-lg font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors duration-200"
                  >
                    <span>💬</span>
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => handleBlockUser(user._id)}
                    className="flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors duration-200"
                    title="Block User"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🌱 Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('garden')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'garden'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏡 Garden
            </button>
            <button
              onClick={() => {
                setActiveTab('liked');
                if (likedPosts.length === 0) {
                  fetchLikedPosts();
                }
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'liked'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ❤️ Liked
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <>
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map(post => (
                    <div key={post._id} className="bg-white rounded-xl shadow-lg border border-gray-100">
                      <PostCard
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 animate-in fadeInUp duration-500">
                  <div className="text-6xl mb-4 animate-bounce">🌱</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {isOwnProfileState ? "You haven't shared any plants yet" : `${displayName} hasn't shared any plants yet`}
                  </h3>
                  <p className="text-gray-500">
                    {isOwnProfileState ? "Start sharing your plant discoveries!" : "Check back later for new posts"}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'garden' && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 animate-in fadeInUp duration-500">
              <div className="text-6xl mb-4 animate-bounce">🏡</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Garden View</h3>
              <p className="text-gray-500">Coming soon! View all plants in a beautiful garden layout.</p>
            </div>
          )}

          {activeTab === 'liked' && (
            <>
              {loadingLiked ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading liked posts...</p>
                </div>
              ) : likedPosts.length > 0 ? (
                <div className="space-y-6">
                  {likedPosts.map(post => (
                    <div key={post._id} className="bg-white rounded-xl shadow-lg border border-gray-100">
                      <PostCard
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 animate-in fadeInUp duration-500">
                  <div className="text-6xl mb-4 animate-bounce">❤️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Liked Posts Yet</h3>
                  <p className="text-gray-500">
                    {isOwnProfileState 
                      ? "Start liking posts to see them here!" 
                      : `${displayName} hasn't liked any posts yet`
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Followers</h3>
              <button
                onClick={() => setShowFollowers(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {followers.length > 0 ? (
                followers.map((follower, index) => (
                  <div key={follower._id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {follower.profilePicture ? (
                          <img 
                            src={follower.profilePicture.startsWith('http') ? follower.profilePicture : `http://localhost:5000${follower.profilePicture}`} 
                            alt={follower.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {follower.name ? follower.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{follower.name}</p>
                        <p className="text-sm text-gray-500">@{follower.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No followers yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Following</h3>
              <button
                onClick={() => setShowFollowing(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {following.length > 0 ? (
                following.map((followingUser, index) => (
                  <div key={followingUser._id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {followingUser.profilePicture ? (
                          <img 
                            src={followingUser.profilePicture.startsWith('http') ? followingUser.profilePicture : `http://localhost:5000${followingUser.profilePicture}`} 
                            alt={followingUser.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {followingUser.name ? followingUser.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{followingUser.name}</p>
                        <p className="text-sm text-gray-500">@{followingUser.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">Not following anyone yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Blocked Users
              </h4>
              
              <div className="overflow-y-auto max-h-64 space-y-2">
                {blockedUsers.length > 0 ? (
                  blockedUsers.map((blockedUser) => (
                    <div key={blockedUser._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center overflow-hidden">
                            {blockedUser.profilePicture ? (
                              <img 
                                src={blockedUser.profilePicture.startsWith('http') ? blockedUser.profilePicture : `http://localhost:5000${blockedUser.profilePicture}`} 
                                alt={blockedUser.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {blockedUser.name ? blockedUser.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{blockedUser.name}</p>
                            <p className="text-xs text-gray-500">@{blockedUser.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockUser(blockedUser._id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-sm">No blocked users</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
