import React, { useState, useRef } from 'react';
import axios from 'axios';

const Explore = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef(null);
  const [result, setResult] = useState(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get user location using HTML5 Geolocation API
  const getLocation = () => {
    setIsGettingLocation(true);
    setUploadStatus('Getting your location...');

    if (!navigator.geolocation) {
      setUploadStatus('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setUploadStatus('Location captured successfully!');
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        setUploadStatus(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadStatus('Please select an image first');
      return;
    }

    if (!location) {
      setUploadStatus('Please capture your location first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading your plant photo...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('lat', location.latitude);
      formData.append('lng', location.longitude);

      const token = localStorage.getItem('token'); // Retrieve token saved after user login
      const response = await axios.post('http://localhost:5000/api/plants/', formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
         },
        });


      setUploadStatus('Plant identified successfully!');
      setResult(response.data); // Save result for display
      console.log('Plant data:', response.data);

      // Reset form fields but keep result
      setSelectedFile(null);
      setPreview(null);
      setLocation(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
      setResult(null); // Clear result on error
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setLocation(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="explore" className="py-20 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-gray-900">
            Our <span className="text-emerald-600">Living Network</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore the global impact of our community through our interactive plant map.
          </p>
        </div>

        {/* Upload Section */}
        <div className="glass-card rounded-3xl p-8 mb-16 fade-in-up">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Upload Your <span className="text-emerald-600">Plant Photo</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Plant Image
                </label>
                <label className="block cursor-pointer">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-emerald-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <span className="font-medium text-emerald-600 hover:text-emerald-500">Upload a file</span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                    required
                  />
                </label>
              </div>

              {/* Image Preview */}
              {preview && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Preview
                  </label>
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Location Capture */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGettingLocation ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {isGettingLocation ? 'Getting Location...' : 'Capture Location'}
                  </button>

                  {location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {uploadStatus && (
                <div className={`p-4 rounded-lg ${uploadStatus.includes('successfully') || uploadStatus.includes('captured')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : uploadStatus.includes('failed') || uploadStatus.includes('error')
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                  {uploadStatus}
                </div>
              )}
              {/* Identification Result */}
              {result && (
               <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 mt-4">
                <h4 className="font-bold mb-2">Identification Result</h4>
                <p><strong>Common Name:</strong> {result.identification?.commonName || result.speciesCommonName}</p>
                <p><strong>Scientific Name:</strong> {result.identification?.scientificName || result.speciesScientificName}</p>
              {/* If you want to show a confidence score: */}
              {/* <p><strong>Score:</strong> {result.identification?.score}</p> */}
            </div>
        )}


              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={!selectedFile || !location || isUploading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    'Identify Plant'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 mb-16 fade-in-up">
          <div className="relative h-[500px] w-full bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive Plant Map</h3>
                <p className="text-gray-600 max-w-md mx-auto">Visualizing our growing network of adopted plants worldwide</p>
              </div>
            </div>

            <div className="absolute top-[30%] left-[25%] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
            <div className="absolute top-[45%] left-[50%] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-[60%] left-[70%] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[25%] left-[65%] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-[50%] left-[15%] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 fade-in-up">
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Global Reach</h3>
            <p className="text-gray-600">Our community spans across 78 countries with plants adopted in diverse ecosystems.</p>
          </div>
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Real Impact</h3>
            <p className="text-gray-600">Each adoption contributes to reforestation efforts and biodiversity conservation.</p>
          </div>
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Community Power</h3>
            <p className="text-gray-600">Join forces with like-minded guardians to amplify your environmental impact.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Explore; 