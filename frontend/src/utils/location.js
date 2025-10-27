// Location utilities: permissions, current position, manual input stub

export async function requestLocationPermission() {
  if (!('geolocation' in navigator)) return { granted: false, reason: 'geolocation_unavailable' };
  try {
    const permission = await navigator.permissions?.query?.({ name: 'geolocation' });
    if (permission && permission.state === 'denied') return { granted: false, reason: 'denied' };
    return { granted: true };
  } catch (_) {
    return { granted: true };
  }
}

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      resolve({ success: false, error: 'Geolocation not available' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        });
      },
      (error) => resolve({ success: false, error: error.message || 'Permission denied' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000, ...options }
    );
  });
}

// Manual location entry stub with simple validation
export function validateManualLocation(input) {
  if (!input || input.length < 3) return { valid: false, reason: 'too_short' };
  return { valid: true };
}


