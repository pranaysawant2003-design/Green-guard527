// Simple reverse geocoding with in-memory cache and fallbacks

const cache = new Map();

function key(lat, lng, lang = 'en') {
  return `${lat.toFixed(4)},${lng.toFixed(4)}:${lang}`;
}

export async function reverseGeocode(lat, lng, lang = 'en') {
  const k = key(lat, lng, lang);
  if (cache.has(k)) return cache.get(k);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1&accept-language=${lang}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GreenGuard/1.0' } });
    const data = await res.json();
    const neighborhood = data?.address?.neighbourhood || data?.address?.suburb || '';
    const city = data?.address?.city || data?.address?.town || data?.address?.village || '';
    const state = data?.address?.state || '';
    const formatted = [neighborhood, city, state].filter(Boolean).join(', ');
    const output = formatted || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    cache.set(k, output);
    return output;
  } catch (_) {
    const output = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    cache.set(k, output);
    return output;
  }
}


