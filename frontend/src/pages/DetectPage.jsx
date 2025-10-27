import React, { useRef, useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import CreatePost from '../components/CreatePost';
import axios from 'axios';
// Emoji replacements for icons
const Icons = {
  Camera: '📷',
  Upload: '📤',
  Check: '✓',
  Close: '✕',
  Retry: '🔄'
};

export default function DetectPage() {
  const [mode, setMode] = useState('camera'); // Default to camera mode
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start/stop camera when mode changes
  useEffect(() => {
    if (mode === 'camera' && !cameraActive) {
      startCamera();
    } else if (mode !== 'camera' && cameraActive) {
      stopCamera();
    }
    
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
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
      setMode('upload'); // Fallback to upload mode
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setFile(file);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG)');
      return;
    }
    
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError('');
  };

  const identify = async () => {
    if (!file) {
      setError('Please capture or upload an image first');
      return;
    }
    
    setLoading(true);
    setResult(null);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post('/api/identify', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        } 
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Identification error:', err);
      setError(err.response?.data?.error || 'Failed to identify plant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetDetection = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (mode === 'camera' && !cameraActive) {
      startCamera();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation />
      
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center text-green-700 hover:text-green-800 transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-green-800">Plant Detection</h1>
          <div className="w-8"></div> {/* For alignment */}
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex border-b">
            <button 
              onClick={() => setMode('camera')}
              className={`flex-1 py-3 font-medium flex items-center justify-center space-x-2 ${
                mode === 'camera' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">{Icons.Camera}</span>
              <span>Camera</span>
            </button>
            <button 
              onClick={() => setMode('upload')}
              className={`flex-1 py-3 font-medium flex items-center justify-center space-x-2 ${
                mode === 'upload' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">{Icons.Upload}</span>
              <span>Upload</span>
            </button>
          </div>
          
          {/* Camera/Upload Area */}
          <div className="p-4">
            {mode === 'camera' ? (
              <div className="relative bg-black rounded-xl overflow-hidden">
                {!preview ? (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      muted
                      className="w-full h-64 md:h-96 object-cover"
                    />
                    {error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center">
                        <p>{error}</p>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        onClick={captureImage}
                        className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all"
                        disabled={!cameraActive}
                      >
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-2xl text-white">{Icons.Camera}</span>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Captured plant" 
                      className="w-full h-64 md:h-96 object-contain bg-black"
                    />
                    <button
                      onClick={resetDetection}
                      className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                      title="Retake"
                    >
                      <span className="text-2xl mr-2">{Icons.Retry}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 transition-colors">
                {!preview ? (
                  <label className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-green-600">{Icons.Upload}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Upload a plant photo</h3>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                      <p className="text-xs text-gray-400">Supports JPG, PNG (max 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Uploaded plant" 
                      className="mx-auto max-h-64 md:max-h-96 object-contain"
                    />
                    <button
                      onClick={resetDetection}
                      className="absolute top-0 right-0 bg-white rounded-full p-2 shadow-md"
                      title="Remove"
                    >
                      <span className="text-2xl mr-2">{Icons.Close}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {error && !preview && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col space-y-3">
              {preview && (
                <button
                  onClick={identify}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white flex items-center justify-center ${
                    loading 
                      ? 'bg-green-400' 
                      : 'bg-green-600 hover:bg-green-700'
                  } transition-colors`}
                >
                  {loading ? (
                    <>
                      <span className="text-2xl mr-2">{Icons.Retry}</span>
                      Identifying...
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-2">{Icons.Check}</span>
                      Identify This Plant
                    </>
                  )}
                </button>
              )}
              
              {result?.success && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full py-3 px-4 rounded-xl font-medium bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                >
                  <FiCamera className="mr-2" />
                  Share This Discovery
                </button>
              )}
            </div>
          </div>
          
          {/* Results */}
          {result && (
            <div className="border-t p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-2">Identification Results</h3>
              {result.error ? (
                <p className="text-red-600">{result.error}</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h4 className="font-medium text-lg text-green-800">{result.plantName || 'Unknown Plant'}</h4>
                    {result.scientificName && (
                      <p className="text-sm text-gray-600 italic">{result.scientificName}</p>
                    )}
                    {result.confidence && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, Math.round(result.confidence * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {result.description && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border text-sm text-gray-700">
                      <h5 className="font-medium mb-1">About this plant:</h5>
                      <p>{result.description}</p>
                    </div>
                  )}
                  
                  {result.similarImages?.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Similar Images:</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {result.similarImages.slice(0, 3).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.url} 
                            alt={`Similar plant ${idx + 1}`} 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreatePost 
              initialImage={file}
              initialCaption={result?.plantName ? `I found a ${result.plantName} 🌿` : ''}
              initialTags={result?.plantName ? result.plantName.toLowerCase().split(' ').join(',') : ''}
              onClose={() => setShowCreate(false)} 
              onPostCreated={() => {
                setShowCreate(false);
                resetDetection();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}


