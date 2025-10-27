import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { reverseGeocode } from '../utils/reverseGeocode';

const CreatePost = ({ onClose, onPostCreated }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [plantIdentifying, setPlantIdentifying] = useState(false);
  const [isUpForAdoption, setIsUpForAdoption] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera when component mounts or showCamera changes
  useEffect(() => {
    if (showCamera && !cameraActive) {
      startCamera();
    } else if (!showCamera && cameraActive) {
      stopCamera();
    }
    
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, [showCamera]);

  const startCamera = async () => {
    try {
      // First stop any existing stream
      if (streamRef.current) {
        stopCamera();
      }

      // Try to get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check your permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !cameraActive) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    
    // Flip the image horizontally for a more natural selfie-like experience
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob (image file)
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const fileName = `plant-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      setImage(file);
      setImagePreview(URL.createObjectURL(blob));
      setShowCamera(false);
    }, 'image/jpeg', 0.9);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (only JPG/PNG for plant identification)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG or PNG image for accurate plant identification.');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB.');
        e.target.value = ''; // Reset input
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const formatted = await reverseGeocode(latitude, longitude);
            setLocation({
              latitude,
              longitude,
              address: formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: '',
              country: ''
            });
          } catch (error) {
            console.error('Geocoding error:', error);
            setLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: '',
              country: ''
            });
          }
          
          setGettingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          setGettingLocation(false);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setGettingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
      alert('Please select an image');
      return;
    }

    if (!location.latitude || !location.longitude) {
      alert('Please get your location first');
      return;
    }

    setLoading(true);
    setPlantIdentifying(true);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('caption', caption);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('address', location.address);
      formData.append('city', location.city);
      formData.append('country', location.country);
      formData.append('tags', tags);
      formData.append('isUpForAdoption', isUpForAdoption);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      onPostCreated(response.data.post);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
      setPlantIdentifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share Plant Discovery</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Camera Preview */}
        {showCamera && (
          <div className="p-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                autoPlay 
                muted
                playsInline
                className="w-full h-64 object-cover"
                style={{
                  transform: cameraActive ? 'scaleX(-1)' : 'none',
                  display: cameraActive ? 'block' : 'none'
                }}
              />
              {!cameraActive && (
                <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                  <div className="text-white">Initializing camera...</div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-4 space-x-4">
              <button
                type="button"
                onClick={captureImage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={!cameraActive}
              >
                📸 Capture
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {imagePreview && !showCamera && (
          <div className="p-4">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Captured plant" 
                className="w-full h-64 object-contain bg-gray-100 rounded-lg"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  startCamera();
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                title="Retake photo"
              >
                🔄
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Photo *
            </label>
            
            {showCamera ? (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  muted
                  className="w-full h-64 md:h-96 object-cover"
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center">
                    <div className="animate-pulse">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all"
                    disabled={!cameraActive}
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-2xl text-white">📸</span>
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => setShowCamera(false)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-white border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <div className="text-sm font-medium text-gray-700">Upload</div>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowCamera(true);
                      await startCamera();
                    }}
                    className="flex-1 bg-white border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-3xl mb-2">📷</div>
                    <div className="text-sm font-medium text-gray-700">Take Photo</div>
                  </button>
                </div>
                
                {imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remove photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              {!showCamera && (
                <p>AI will automatically identify the plant. Max size: 10MB</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>📍</span>
                <span>{gettingLocation ? 'Getting...' : 'Get Location'}</span>
              </button>
              {location.address && (
                <span className="text-sm text-gray-600 flex-1">
                  {location.address}
                </span>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell us about this plant discovery..."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {caption.length}/500 characters
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="houseplant, garden, rare, flowering (comma separated)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </div>
          </div>

          {/* Adoption Toggle */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  🌱 Available for Adoption
                </label>
                <p className="text-xs text-gray-600">
                  Make this plant available on the adoption map for others to find and adopt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpForAdoption(!isUpForAdoption)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isUpForAdoption ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isUpForAdoption ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {isUpForAdoption && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-100 rounded-md px-3 py-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>This plant will appear on the adoption map for nearby users</span>
              </div>
            )}
          </div>

          {/* Plant Identification Status */}
          {plantIdentifying && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-green-700">
                  🤖 AI is identifying your plant...
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !image || !location.latitude}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Posting...' : 'Share Discovery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;

