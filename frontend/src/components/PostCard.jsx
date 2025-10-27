import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Helper to build a valid image URL from stored path (handles Windows backslashes)
const buildImageSrc = (raw) => {
  if (!raw) return null;
  
  console.log('Raw image URL:', raw); // Debug log
  
  const cleaned = String(raw).replace(/\\\\/g, '/').replace(/\\/g, '/');
  
  // If it's already a full URL, return as-is
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  
  // Remove leading slashes and build full URL
  const withoutLeadingSlash = cleaned.replace(/^\/+/, '');
  const fullUrl = `http://localhost:5000/${withoutLeadingSlash}`;
  
  console.log('Built image URL:', fullUrl); // Debug log
  
  return fullUrl;
};

// Cache for reverse geocoding results to avoid duplicate API calls
const geocodeCache = new Map();
let lastGeocodingTime = 0;
const GEOCODING_DELAY = 1000; // 1 second between API calls

// Reverse geocoding utility for getting location names from coordinates
const reverseGeocode = async (lat, lng) => {
  // Create cache key (rounded to 2 decimals to group nearby locations)
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    console.log('Using cached location for:', cacheKey);
    return geocodeCache.get(cacheKey);
  }
  
  // Rate limiting: wait if last call was too recent
  const now = Date.now();
  const timeSinceLastCall = now - lastGeocodingTime;
  if (timeSinceLastCall < GEOCODING_DELAY) {
    await new Promise(resolve => setTimeout(resolve, GEOCODING_DELAY - timeSinceLastCall));
  }
  lastGeocodingTime = Date.now();
  
  try {
    console.log('Fetching location for:', lat, lng);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Green Guardian/1.0'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const result = {
        city: data.address.city || data.address.town || data.address.village || '',
        country: data.address.country || '',
        formatted: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
      // Cache the result
      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  
  const fallback = {
    city: '',
    country: '',
    formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  };
  geocodeCache.set(cacheKey, fallback);
  return fallback;
};

const PostCard = ({ post, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);
  const [adoptionStatus, setAdoptionStatus] = useState(post.adoptionStatus || 'available');
  const [adoptionSubmitting, setAdoptionSubmitting] = useState(false);
  const [adoptionError, setAdoptionError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const imageSrc = buildImageSrc(post.imageUrl);

  // Check if current user is following the post author
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const currentUserResponse = await fetch('http://localhost:5000/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentUser = await currentUserResponse.json();
          
          // Show follow button if not own post
          if (currentUser.user._id !== post.author._id) {
            setShowFollowButton(true);
            // Check if current user is following the post author
            setIsFollowing(currentUser.user.following && currentUser.user.following.includes(post.author._id));
          } else {
            setShowFollowButton(false);
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = u?._id || u?.id;
      setIsOwner(userId === post.author._id);
      
      // Check if current user is in rejected adopters list
      if (post.rejectedAdopters && Array.isArray(post.rejectedAdopters)) {
        const isUserRejected = post.rejectedAdopters.some(id => id === userId);
        setIsRejected(isUserRejected);
      }
    } catch (_) {}
  }, [post.author._id, post.rejectedAdopters]);

  // Get location name from coordinates if city is not available
  useEffect(() => {
    const getLocationName = async () => {
      console.log('Post location data:', post?.location); // Debug log
      
      // If we already have city name, use it
      if (post?.location?.city) {
        setLocationName(post.location.city);
        console.log('Using existing city:', post.location.city);
        return;
      }

      // Check different coordinate formats that might be stored
      let lat, lng;
      
      // Format 1: coordinates object with lat/lng
      if (post?.location?.coordinates?.lat && post?.location?.coordinates?.lng) {
        lat = post.location.coordinates.lat;
        lng = post.location.coordinates.lng;
      }
      // Format 2: coordinates array [lng, lat] (GeoJSON format)
      else if (post?.location?.coordinates && Array.isArray(post.location.coordinates) && post.location.coordinates.length === 2) {
        lng = post.location.coordinates[0];
        lat = post.location.coordinates[1];
      }
      // Format 3: direct lat/lng on location object
      else if (post?.location?.latitude && post?.location?.longitude) {
        lat = post.location.latitude;
        lng = post.location.longitude;
      }

      if (lat && lng) {
        const postInfo = `Post: ${post?.plantData?.commonName || 'Unknown'} (${post?._id?.slice(-6) || 'no-id'})`;
        console.log(`[${postInfo}] Reverse geocoding for: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        try {
          const locationData = await reverseGeocode(lat, lng);
          const displayName = locationData.city || locationData.formatted;
          setLocationName(displayName);
          console.log(`[${postInfo}] Location set to: ${displayName}`);
        } catch (error) {
          console.error(`[${postInfo}] Error getting location:`, error);
          setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        }
      }
    };

    getLocationName();
  }, [post?.location]);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    await onLike(post._id);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      await onComment(post._id, commentText);
      setCommentText('');
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${post.author._id}/follow`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to follow user');
      }
      
      const data = await response.json();
      setIsFollowing(data.isFollowing);
      
      // Show success message
      console.log(data.message);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('Failed to load image:', imageSrc);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const requestAdoption = async () => {
    try {
      setAdoptionSubmitting(true);
      setAdoptionError('');
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${post._id}/adopt/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to request');
      setAdoptionStatus(data.status || 'pending');
    } catch (e) {
      setAdoptionError(e.message);
    } finally {
      setAdoptionSubmitting(false);
    }
  };

  const cancelAdoption = async () => {
    try {
      setAdoptionSubmitting(true);
      setAdoptionError('');
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${post._id}/adopt/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to cancel');
      setAdoptionStatus(data.status || 'available');
    } catch (e) {
      setAdoptionError(e.message);
    } finally {
      setAdoptionSubmitting(false);
    }
  };

  const acceptAdoption = async () => {
    try {
      setAdoptionSubmitting(true);
      setAdoptionError('');
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${post._id}/adopt/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to accept');
      setAdoptionStatus(data.status || 'adopted');
    } catch (e) {
      setAdoptionError(e.message);
    } finally {
      setAdoptionSubmitting(false);
    }
  };

  const rejectAdoption = async () => {
    try {
      setAdoptionSubmitting(true);
      setAdoptionError('');
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:5000/api/posts/${post._id}/adopt/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to reject');
      setAdoptionStatus(data.status || 'available');
    } catch (e) {
      setAdoptionError(e.message);
    } finally {
      setAdoptionSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden transition-all duration-200 hover:shadow-lg enhanced-shadow">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <Link 
            to={`/profile/${post.author.username}`}
            className="flex-shrink-0 hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-green-200 group-hover:ring-green-300 transition-all duration-200">
                {post.author.profilePicture ? (
                  <img
                    src={post.author.profilePicture.startsWith('http') ? post.author.profilePicture : `http://localhost:5000${post.author.profilePicture}`}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      const initial = post.author.name ? post.author.name.charAt(0).toUpperCase() : 'U';
                      e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2310B981"><rect width="100" height="100" rx="50"/><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em" fill="white" font-family="Arial">${initial}</text></svg>`;
                    }}
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {post.author.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {post.author.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link 
                to={`/profile/${post.author.username}`}
                className="font-semibold text-gray-900 hover:text-green-700 transition-colors truncate max-w-[120px] sm:max-w-[180px]"
              >
                {post.author.name}
              </Link>
              <span className="text-gray-500 text-sm hidden sm:inline">•</span>
              <span className="text-gray-500 text-sm whitespace-nowrap">{formatDate(post.createdAt)}</span>
            </div>
            <Link 
              to={`/profile/${post.author.username}`}
              className="text-gray-500 text-sm hover:text-green-600 transition-colors truncate block"
            >
              @{post.author.username}
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {showFollowButton && (
            <button
              onClick={handleFollow}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                isFollowing
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
              } whitespace-nowrap`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="More options"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  {/* Copy Link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                      alert('Link copied to clipboard!');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy link
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: post.plantData?.commonName || 'Plant Post',
                          text: post.caption || 'Check out this plant!',
                          url: `${window.location.origin}/post/${post._id}`
                        });
                      } else {
                        alert('Sharing not supported on this browser');
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>

                  {/* Report (for non-owners) */}
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = u?._id || u?.id;
                      if (userId !== post.author._id) {
                        return (
                          <button
                            onClick={() => {
                              alert('Post reported. Our team will review it shortly.');
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Report post
                          </button>
                        );
                      }
                    } catch (_) {}
                    return null;
                  })()}

                  {/* Divider for owner actions */}
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = u?._id || u?.id;
                      if (userId === post.author._id) {
                        return <div className="border-t border-gray-200 my-1" />;
                      }
                    } catch (_) {}
                    return null;
                  })()}

                  {/* Edit (for owners) */}
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = u?._id || u?.id;
                      if (userId === post.author._id) {
                        return (
                          <button
                            onClick={() => {
                              alert('Edit feature coming soon!');
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit post
                          </button>
                        );
                      }
                    } catch (_) {}
                    return null;
                  })()}

                  {/* Delete (for owners) */}
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = u?._id || u?.id;
                      console.log('Delete check - Current user:', userId, 'Post author:', post.author._id);
                      if (userId === post.author._id) {
                        return (
                          <button
                            onClick={async () => {
                              setShowDropdown(false);
                              
                              // Confirmation dialog
                              if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                return;
                              }
                              
                              try {
                                const token = localStorage.getItem('token');
                                const resp = await fetch(`http://localhost:5000/api/posts/${post._id}`, { 
                                  method: 'DELETE', 
                                  headers: { Authorization: `Bearer ${token}` } 
                                });
                                
                                if (!resp.ok) {
                                  const error = await resp.json();
                                  throw new Error(error.error || 'Failed to delete post');
                                }
                                
                                alert('Post deleted successfully!');
                                window.location.reload();
                              } catch (e) {
                                console.error('Delete post failed', e);
                                alert(e.message || 'Failed to delete post. Please try again.');
                              }
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete post
                          </button>
                        );
                      }
                    } catch (_) {}
                    return null;
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 mb-3">
          <p className="text-gray-800 leading-relaxed text-left">{post.caption}</p>
        </div>
      )}

      {/* Media */}
      {imageSrc && (
        <div 
          className="mx-4 mb-2 rounded-xl overflow-hidden bg-gray-100 aspect-video relative post-image-container cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setShowImageModal(true)}
        >
          <img
            src={imageSrc}
            alt={post?.plantData?.commonName || 'Plant'}
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Image not available</p>
              </div>
            </div>
          )}
          {/* Zoom icon overlay */}
          <div className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </div>
        </div>
      )}

      {/* Info chips below media */}
      <div className="px-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {post?.plantData?.commonName && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium shadow-sm">
              🌿 {post.plantData.commonName}
              {post.plantData.confidence && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-200 rounded-full text-xs">
                  {post.plantData.confidence}%
                </span>
              )}
            </span>
          )}
          {locationName && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium shadow-sm">
              📍 {locationName}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Plant Info */}
        <div className="mb-4 text-left">
          <h4 className="font-semibold text-lg text-green-800 mb-2">
            {post?.plantData?.commonName || 'Unknown Plant'}
          </h4>
          {post?.plantData?.scientificName && (
            <p className="text-sm text-gray-600 italic mb-1">
              {post.plantData.scientificName}
            </p>
          )}
          {post?.plantData?.family && (
            <p className="text-xs text-gray-500">
              Family: {post.plantData.family}
            </p>
          )}
        </div>

        {/* Care Info */}
        {post.careInfo && Object.keys(post.careInfo).length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-100 text-left">
            <h5 className="font-medium text-green-800 mb-3 flex items-center">
              <span className="mr-2">🌱</span>
              Care Tips
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {post.careInfo.wateringFrequency && (
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 text-lg">💧</span>
                  <div>
                    <p className="font-medium text-gray-700">Watering</p>
                    <p className="text-gray-600">{post.careInfo.wateringFrequency}</p>
                  </div>
                </div>
              )}
              {post.careInfo.sunlightNeeds && (
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500 text-lg">☀️</span>
                  <div>
                    <p className="font-medium text-gray-700">Sunlight</p>
                    <p className="text-gray-600">{post.careInfo.sunlightNeeds}</p>
                  </div>
                </div>
              )}
              {post.careInfo.difficulty && (
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600 text-lg">📊</span>
                  <div>
                    <p className="font-medium text-gray-700">Difficulty</p>
                    <p className="text-gray-600">{post.careInfo.difficulty}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {post?.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-green-200 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1.5 hover:text-blue-500 transition-all duration-200 hover:scale-105"
            >
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
            </button>

            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1.5 hover:text-green-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Share</span>
            </button>
          </div>

          {/* Adopt button */}
          {!isOwner && (
            <div className="flex items-center flex-shrink-0">
              {isRejected ? (
                <span 
                  className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-500 flex items-center gap-1 cursor-not-allowed whitespace-nowrap"
                  title="Your previous adoption request was declined"
                >
                  <span>🚫</span>
                  <span>Not Available</span>
                </span>
              ) : (
                <>
                  {adoptionStatus === 'available' && (
                    <button
                      disabled={adoptionSubmitting}
                      onClick={requestAdoption}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${adoptionSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'}`}
                    >
                      <span>🌱</span>
                      <span>Adopt</span>
                    </button>
                  )}
                  {adoptionStatus === 'pending' && (
                    <button
                      disabled={adoptionSubmitting}
                      onClick={cancelAdoption}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${adoptionSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md'}`}
                    >
                      <span>⏳</span>
                      <span>Requested</span>
                    </button>
                  )}
                  {adoptionStatus === 'adopted' && (
                    <span className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 flex items-center gap-1 whitespace-nowrap">
                      <span>✓</span>
                      <span>Adopted</span>
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Owner actions for pending requests */}
        {isOwner && adoptionStatus === 'pending' && (
          <div className="mt-3 p-3 border rounded-lg bg-yellow-50 border-yellow-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-yellow-800">Adoption requested for this post</div>
            <div className="flex gap-2 flex-shrink-0">
              <button 
                onClick={rejectAdoption} 
                disabled={adoptionSubmitting} 
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${adoptionSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Reject
              </button>
              <button 
                onClick={acceptAdoption} 
                disabled={adoptionSubmitting} 
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${adoptionSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {adoptionError && (
          <div className="mt-2 text-xs text-red-600">{adoptionError}</div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in slideInUp duration-200">
            {/* Comment Form */}
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 edit-form-input"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed btn-primary"
                >
                  Post
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {post.comments?.map((comment, index) => (
                <div key={index} className="flex space-x-3 animate-in fadeInUp duration-200 comment-item" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {comment.user.profilePicture ? (
                      <img 
                        src={comment.user.profilePicture.startsWith('http') ? comment.user.profilePicture : `http://localhost:5000${comment.user.profilePicture}`} 
                        alt={comment.user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {comment.user.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-left">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Enlargement Modal */}
        {showImageModal && imageSrc && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" 
            onClick={() => setShowImageModal(false)}
          >
            <div 
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Enlarged Image */}
              <img
                src={imageSrc}
                alt={post?.plantData?.commonName || 'Plant'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Share Post</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Copy Link */}
                <button
                  onClick={() => {
                    const postUrl = `${window.location.origin}/post/${post._id}`;
                    navigator.clipboard.writeText(postUrl);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {copySuccess ? '✓ Copied!' : 'Copy Link'}
                    </p>
                    <p className="text-xs text-gray-500">Share via link</p>
                  </div>
                </button>

                {/* Native Share (if supported) */}
                {navigator.share && (
                  <button
                    onClick={() => {
                      const postUrl = `${window.location.origin}/post/${post._id}`;
                      navigator.share({
                        title: `${post.plantData?.commonName || 'Plant'} - Green Guardian`,
                        text: post.caption || 'Check out this plant!',
                        url: postUrl
                      }).then(() => {
                        setShowShareModal(false);
                      }).catch((error) => {
                        console.log('Error sharing:', error);
                      });
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">Share via...</p>
                      <p className="text-xs text-gray-500">Use native share menu</p>
                    </div>
                  </button>
                )}

                {/* Share to Twitter */}
                <button
                  onClick={() => {
                    const postUrl = `${window.location.origin}/post/${post._id}`;
                    const text = `Check out this ${post.plantData?.commonName || 'plant'} on Green Guardian! 🌱`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Share on Twitter</p>
                    <p className="text-xs text-gray-500">Post to your timeline</p>
                  </div>
                </button>

                {/* Share to WhatsApp */}
                <button
                  onClick={() => {
                    const postUrl = `${window.location.origin}/post/${post._id}`;
                    const text = `Check out this ${post.plantData?.commonName || 'plant'} on Green Guardian! 🌱 ${postUrl}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Share on WhatsApp</p>
                    <p className="text-xs text-gray-500">Send to contacts</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
