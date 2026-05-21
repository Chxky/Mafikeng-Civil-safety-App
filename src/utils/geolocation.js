// Geolocation service with fallback and fuzzing for privacy

const MAHIKENG_CENTER = { lat: -25.8653, lng: 25.6441 };
const MAHIKENG_BOUNDS = {
  south: -25.92,
  north: -25.81,
  west: 25.58,
  east: 25.71,
};

/**
 * Get current position with high accuracy
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        // Fallback to Mahikeng center if denied
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            ...MAHIKENG_CENTER,
            accuracy: 1000,
            timestamp: Date.now(),
            isFallback: true,
          });
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        ...options,
      }
    );
  });
}

/**
 * Watch position for real-time tracking (patrol mode)
 */
export function watchPosition(callback, errorCallback, options = {}) {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation not supported'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      ...options,
    }
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Fuzz location to nearest intersection for public display
 * Privacy protection: strips exact coordinates from public views
 */
export function fuzzLocation(lat, lng, precision = 3) {
  // Round to ~111m grid (3 decimal places)
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if coordinates are within Mahikeng bounds
 */
export function isWithinMahikeng(lat, lng) {
  return (
    lat >= MAHIKENG_BOUNDS.south &&
    lat <= MAHIKENG_BOUNDS.north &&
    lng >= MAHIKENG_BOUNDS.west &&
    lng <= MAHIKENG_BOUNDS.east
  );
}

/**
 * Get Mahikeng map center
 */
export function getMahikengCenter() {
  return MAHIKENG_CENTER;
}

/**
 * Get Mahikeng map bounds for Leaflet
 */
export function getMahikengBounds() {
  return [
    [MAHIKENG_BOUNDS.south, MAHIKENG_BOUNDS.west],
    [MAHIKENG_BOUNDS.north, MAHIKENG_BOUNDS.east],
  ];
}

/**
 * Reverse geocode using Nominatim (free, no API key)
 * Falls back to coordinates if request fails
 */
export async function reverseGeocode(lat, lng) {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (!resp.ok) throw new Error('Geocoding failed');

    const data = await resp.json();

    if (data.address) {
      const { road, suburb, neighbourhood } = data.address;
      const street = road || neighbourhood || suburb;
      const area = suburb || 'Mahikeng';
      return street ? `${street}, ${area}` : area;
    }

    return data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    // Offline or rate-limited — return coordinates
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
