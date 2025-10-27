import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced plant marker icon with health score
const createPlantIcon = (post) => {
  const statusConfig = {
    available: { color: '#22c55e', emoji: '🌱', border: '#16a34a', shadow: '0 3px 10px rgba(34, 197, 94, 0.4)' },
    pending:   { color: '#f59e0b', emoji: '⏳', border: '#d97706', shadow: '0 3px 10px rgba(245, 158, 11, 0.4)' },
    adopted:   { color: '#10b981', emoji: '❤️', border: '#059669', shadow: '0 3px 10px rgba(16, 185, 129, 0.4)' }
  };
  
  const status = post.adoptionStatus || 'available';
  const config = statusConfig[status] || statusConfig.available;
  const healthScore = post.healthScore || 85;
  
  return L.divIcon({
    className: 'custom-plant-marker',
    html: `
      <div style="
        background: ${config.color};
        width: 45px;
        height: 45px;
        border-radius: 50%;
        border: 3px solid ${config.border};
        box-shadow: ${config.shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        position: relative;
        animation: pulse 2s ease-in-out infinite;
      ">
        ${config.emoji}
        <div style="
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          background: ${healthScore > 80 ? '#10b981' : healthScore > 60 ? '#f59e0b' : '#ef4444'};
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: white;
          font-weight: bold;
        ">
          ${Math.round(healthScore)}
        </div>
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Component to recenter map when user location changes
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const AdoptionMapPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false so map shows immediately
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Default to Pune
  const [selectedRadius, setSelectedRadius] = useState(20);
  const [selectedPost, setSelectedPost] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [mapError, setMapError] = useState(null);
  const mapContainerRef = useRef(null);
  const [mapKey, setMapKey] = useState(0); // Force re-render of map

  const radiusOptions = [
    { value: 10, label: '10 km', icon: '📍' },
    { value: 20, label: '20 km', icon: '🎯' },
    { value: 30, label: '30 km', icon: '🗺️' },
    { value: 50, label: '50 km', icon: '🌍' }
  ];

  // Get user's current location
  useEffect(() => {
    console.log('AdoptionMap - Getting user location...');
    
    // Set a timeout to use default location if user doesn't respond
    const locationTimeout = setTimeout(() => {
      if (!userLocation) {
        console.log('AdoptionMap - Location timeout, using default location');
        setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi, India
        setLocationError('Using default location. Allow location access for accurate results.');
      }
    }, 5000); // 5 second timeout

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          const { latitude, longitude } = position.coords;
          console.log('AdoptionMap - Location obtained:', { latitude, longitude });
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError('');
        },
        (error) => {
          clearTimeout(locationTimeout);
          console.error('AdoptionMap - Location error:', error);
          setLocationError('Unable to get your location. Using default location.');
          // Default to a location if geolocation fails
          console.log('AdoptionMap - Using default location (Delhi)');
          setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi, India
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    } else {
      clearTimeout(locationTimeout);
      console.error('AdoptionMap - Geolocation not supported');
      setLocationError('Geolocation is not supported by your browser.');
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }

    return () => clearTimeout(locationTimeout);
  }, []);

  // Fetch posts for adoption within selected radius
  useEffect(() => {
    if (userLocation) {
      console.log('AdoptionMap - useEffect triggered, fetching posts...');
      fetchAdoptionPosts();
    }
  }, [userLocation, selectedRadius]);
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('AdoptionMap - State changed - Loading:', loading, 'Posts:', posts.length);
  }, [loading, posts]);

  const fetchAdoptionPosts = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log('AdoptionMap - Token exists:', !!token);
      console.log('AdoptionMap - User location:', userLocation);
      console.log('AdoptionMap - Selected radius:', selectedRadius);
      
      if (!token) {
        console.error('No authentication token found');
        setLocationError('Please log in to view the adoption map');
        setLoading(false);
        return;
      }

      console.log('AdoptionMap - Making API request to /api/posts/adoption-map');
      const response = await axios.get('/api/posts/adoption-map', {
        params: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: selectedRadius
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Validate posts have required location data
      const validPosts = (response.data.posts || []).filter(post => {
        const hasLocation = post.location?.coordinates?.lat && post.location?.coordinates?.lng;
        if (!hasLocation) {
          console.warn('Post missing location:', post._id);
        }
        return hasLocation;
      });
      
      setPosts(validPosts);
    } catch (error) {
      console.error('Error fetching adoption posts:', error);
      if (error.response?.status === 401) {
        setLocationError('Authentication failed. Please log in again.');
      } else {
        setLocationError(error.response?.data?.error || 'Failed to load adoption posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptRequest = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find the post to get author info
      const post = posts.find(p => p._id === postId);
      
      await axios.post(`/api/posts/${postId}/adopt/request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const authorUsername = post?.author?.username;
      const plantName = post?.plantData?.commonName || 'plant';
      
      // Show success message with DM link
      if (window.confirm(`✅ Adoption request sent!\n\nA message has been sent to ${post?.author?.name}.\n\nWould you like to view the conversation?`)) {
        navigate(`/messages/${authorUsername}`);
      } else {
        fetchAdoptionPosts(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send adoption request';
      alert(errorMessage);
      if (error.response?.status === 403) {
        // Refresh to update the UI
        fetchAdoptionPosts();
      }
    }
  };

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold mb-2">Getting your location...</p>
          <p className="text-gray-600 text-sm mb-4">Please allow location access when prompted</p>
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-yellow-800 text-sm">{locationError}</p>
            </div>
          )}
          <button
            onClick={() => {
              console.log('Manual location set');
              setUserLocation({ lat: 28.6139, lng: 77.2090 });
              setLocationError('Using default location (Delhi, India)');
            }}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Use Default Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .custom-plant-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          display: none;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
        {/* Header - Snapchat Style */}
      <div className="bg-white shadow-md sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">🗺️ Adoption Map</h1>
                <p className="text-xs text-gray-600">Find plants near you</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                posts.length > 0 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {loading ? '⏳ Loading...' : `🌱 ${posts.length} plants nearby`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distance Filter - Snapchat Style Pills */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-[999]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div className="text-xs text-gray-600">
              📍 Your location: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Loading...'}
              {posts.length > 0 && ` • Found ${posts.length} plant(s) within ${selectedRadius}km`}
            </div>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2">Distance:</span>
            {radiusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedRadius(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedRadius === option.value
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: 'calc(100vh - 140px)' }}>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-gray-700">Loading plants...</p>
              <p className="text-xs text-gray-500 mt-2">Loading state: {loading ? 'true' : 'false'}</p>
              <p className="text-xs text-gray-500">Posts count: {posts.length}</p>
              {posts.length > 0 && (
                <button
                  onClick={() => setLoading(false)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Show Map ({posts.length} plants loaded)
                </button>
              )}
            </div>
          </div>
        )}
        
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center p-6 bg-white rounded-lg shadow-xl max-w-md">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="font-bold text-red-700 mb-2">Map Error</h3>
              <p className="text-gray-700 text-sm">{mapError.toString()}</p>
              <button
                onClick={() => {
                  setMapError(null);
                  window.location.reload();
                }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Reload Page
              </button>
            </div>
          </div>
        ) : !userLocation || !userLocation.lat || !userLocation.lng ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-gray-700">Waiting for location...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            key={mapKey}
            center={[userLocation.lat, userLocation.lng]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            scrollWheelZoom={true}
          >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={[userLocation.lat, userLocation.lng]} />

          {/* Search Radius Circle */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={selectedRadius * 1000} // Convert km to meters
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 10'
            }}
          />

          {/* User Location Marker */}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  background: #3b82f6;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                  animation: pulse 2s ease-in-out infinite;
                "></div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
          >
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-blue-600 mb-2">📍 You are here</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Lat: {userLocation.lat.toFixed(6)}</div>
                  <div>Lng: {userLocation.lng.toFixed(6)}</div>
                  <div className="mt-2 text-blue-700 font-medium">
                    Search radius: {selectedRadius} km
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Plant Markers */}
          {posts.map((post) => (
              <Marker
                key={post._id}
                position={[post.location.coordinates.lat, post.location.coordinates.lng]}
                icon={createPlantIcon(post)}
                eventHandlers={{
                  click: () => setSelectedPost(post)
                }}
              >
              <Popup maxWidth={280} className="custom-popup">
                <div className="p-2">
                  {/* Plant Image */}
                  {post.images && post.images[0] && (
                    <img
                      src={`http://localhost:5000${post.images[0]}`}
                      alt={post.plantData.commonName}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/280x160?text=Plant+Image';
                      }}
                    />
                  )}

                  {/* Plant Info */}
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {post.plantData.commonName || 'Unknown Plant'}
                  </h3>
                  {post.plantData.scientificName && (
                    <p className="text-sm text-gray-600 italic mb-2">
                      {post.plantData.scientificName}
                    </p>
                  )}

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {post.caption}
                    </p>
                  )}

                  {/* Distance & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {post.distance} km away
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      post.adoptionStatus === 'available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {post.adoptionStatus === 'available' ? '✅ Available' : '⏳ Pending'}
                    </span>
                  </div>

                  {/* Author - Clickable */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${post.author?.username}`);
                    }}
                    className="w-full flex items-center mb-3 pb-3 border-b border-gray-200 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mr-3 border-2 border-emerald-200 group-hover:border-emerald-400 transition overflow-hidden">
                      {post.author?.profilePicture ? (
                        <img 
                          src={post.author.profilePicture.startsWith('http') ? post.author.profilePicture : `http://localhost:5000${post.author.profilePicture}`}
                          alt={post.author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-emerald-700">
                          {post.author?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition">
                        {post.author?.name}
                      </p>
                      <p className="text-xs text-gray-600">@{post.author?.username}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Adopt Button - Only show if plant is up for adoption */}
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = u?._id || u?.id;
                      const isRejected = post.rejectedAdopters && post.rejectedAdopters.includes(userId);
                      
                      if (isRejected) {
                        return (
                          <div className="text-center text-sm text-gray-600 bg-gray-100 py-2 rounded-lg" title="Your previous adoption request was declined">
                            🚫 Not Available
                          </div>
                        );
                      }
                    } catch (_) {}
                    
                    if (post.isUpForAdoption && post.adoptionStatus === 'available') {
                      return (
                        <button
                          onClick={() => handleAdoptRequest(post._id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          🌱 Request to Adopt
                        </button>
                      );
                    }
                    
                    if (post.isUpForAdoption && post.adoptionStatus === 'pending') {
                      return (
                        <div className="text-center text-sm text-yellow-700 bg-yellow-50 py-2 rounded-lg">
                          ⏳ Adoption request pending
                        </div>
                      );
                    }
                    
                    if (!post.isUpForAdoption) {
                      return (
                        <div className="text-center text-sm text-gray-600 bg-gray-50 py-2 rounded-lg">
                          ℹ️ Not available for adoption
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        )}
      </div>

      {/* Bottom Info Card - Snapchat Style */}
      {posts.length === 0 && !loading && !locationError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 max-w-sm mx-4 z-[1000]">
          <div className="text-center">
            <div className="text-4xl mb-2">🌱</div>
            <h3 className="font-bold text-gray-900 mb-1">No plants nearby</h3>
            <p className="text-sm text-gray-600">
              Try increasing the distance radius or check back later
            </p>
          </div>
        </div>
      )}

      {/* Error Card */}
      {locationError && !loading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 max-w-sm mx-4 z-[1000] border-2 border-red-200">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="font-bold text-red-700 mb-1">Error</h3>
            <p className="text-sm text-gray-700">
              {locationError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AdoptionMapPage;
