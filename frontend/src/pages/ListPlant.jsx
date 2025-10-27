import React, { useState } from 'react';
import axios from 'axios';

export default function ListPlant() {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) { setMessage('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, { headers: { 'User-Agent': 'GreenGuard/1.0' } });
        const data = await res.json();
        const address = data?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setLocation({ latitude, longitude, address });
      } catch (_) {
        setLocation({ latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      }
    }, () => setMessage('Unable to get location'));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!image) { setMessage('Image is required'); return; }
    if (!location.latitude || !location.longitude) { setMessage('Please set your location'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      const data = new FormData();
      data.append('speciesCommonName', '');
      data.append('speciesScientificName', '');
      data.append('description', caption);
      data.append('lat', location.latitude);
      data.append('lng', location.longitude);
      data.append('image', image);
      const token = localStorage.getItem('token');
      await axios.post('/api/plants', data, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Plant listed successfully');
      setImage(null);
      setCaption('');
      setTags('');
      setLocation({ latitude: null, longitude: null, address: '' });
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to list plant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => window.history.back()} className="px-3 py-2 rounded-lg border text-sm">← Back</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plant Photo *</label>
          <input type="file" accept="image/*" onChange={(e)=> setImage(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
          <textarea value={caption} onChange={(e)=> setCaption(e.target.value)} rows={3} placeholder="Tell adopters about this plant..." className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={getCurrentLocation} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Use Current Location</button>
            {location.address && (
              <span className="text-sm text-gray-600 truncate">{location.address}</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <input type="text" value={tags} onChange={(e)=> setTags(e.target.value)} placeholder="optional, comma separated" className="w-full border rounded px-3 py-2" />
        </div>
        {message && <div className="text-sm text-gray-700">{message}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'List Plant'}</button>
        </div>
      </form>
    </div>
  );
}


