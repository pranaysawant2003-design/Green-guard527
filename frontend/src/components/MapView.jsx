import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { requestLocationPermission, getCurrentPosition } from '../utils/location';
import { reverseGeocode } from '../utils/reverseGeocode';

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google.maps);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function MapView() {
  const [plants, setPlants] = useState([]);
  const [status, setStatus] = useState('available');
  const [filters, setFilters] = useState({ type: 'all', distanceKm: 50 });
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const fetchPlants = async () => {
    const res = await axios.get('/api/plants', { params: { status, limit: 200 } });
    setPlants(res.data.plants || []);
  };

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const perm = await requestLocationPermission();
        if (perm.granted) {
          const pos = await getCurrentPosition();
          if (pos.success) {
            setCenter({ lat: pos.coords.lat, lng: pos.coords.lng });
            const name = await reverseGeocode(pos.coords.lat, pos.coords.lng);
            setAddress(name);
          }
        }
        const maps = await loadGoogleMaps(apiKey);
        if (!isMounted) return;
        mapInstance.current = new maps.Map(mapRef.current, {
          center,
          zoom: 11,
          clickableIcons: false,
          mapId: 'adoption-map'
        });
        await fetchPlants();
      } catch (e) {
        console.error('Map init error', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [status]);

  // Render markers
  useEffect(() => {
    if (!mapInstance.current) return;
    const maps = window.google.maps;
    // clear
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    plants.forEach((p) => {
      const icon = {
        path: maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: p.adoptionStatus === 'available' ? '#16a34a' : p.adoptionStatus === 'pending' ? '#f59e0b' : '#6b7280',
        fillOpacity: 0.9,
        strokeWeight: 1,
        strokeColor: '#ffffff'
      };
      const marker = new maps.Marker({
        position: { lat: p.location.lat, lng: p.location.lng },
        map: mapInstance.current,
        icon
      });
      const rawPath = String(p.imageUrl).replace(/\\\\/g, '/').replace(/\\/g, '/').replace(/^\/+/, '');
      const imgUrl = `http://localhost:5000/${rawPath}`;
      const html = `<div style="max-width:220px"><img src="${imgUrl}" style="width:100%;border-radius:8px;object-fit:cover" /><div style="padding:6px 2px"><strong>${p.speciesCommonName || 'Plant'}</strong><div style="color:#666;font-size:12px">${p.adoptionStatus}</div></div></div>`;
      const preview = new maps.InfoWindow({ content: html });
      marker.addListener('click', () => {
        preview.open({ anchor: marker, map: mapInstance.current });
      });
      markersRef.current.push(marker);
    });
  }, [plants]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white rounded-xl shadow p-3 flex-1">
            <div className="text-xs text-gray-500">Location</div>
            <div className="font-medium text-gray-800">{address || 'Detecting location…'}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1">
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="adopted">Adopted</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          <button onClick={()=> window.history.back()} className="px-3 py-2 rounded-lg border text-sm">← Back</button>
        </div>

        <div ref={mapRef} className="w-full h-[70vh] bg-white rounded-xl shadow overflow-hidden" />
      </div>
    </div>
  );
}


