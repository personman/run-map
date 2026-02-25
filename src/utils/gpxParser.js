import GpxParser from 'gpxparser';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBounds = (coordinates) => {
  const lngs = coordinates.map(coord => coord[0]);
  const lats = coordinates.map(coord => coord[1]);
  return {
    sw: [Math.min(...lngs), Math.min(...lats)],
    ne: [Math.max(...lngs), Math.max(...lats)],
  };
};

/**
 * Parse a GPX XML string into an activity object.
 * @param {string} gpxText  - Raw GPX XML
 * @param {string} fileName - Used as fallback name
 * @returns {object|null}   - Parsed activity or null on failure
 */
export function parseGpxText(gpxText, fileName) {
  try {
    const gpx = new GpxParser();
    gpx.parse(gpxText);

    if (gpx.tracks.length === 0) {
      console.warn(`No tracks found in ${fileName}`);
      return null;
    }

    const track = gpx.tracks[0];

    const coordinates = track.points
      .filter(p => typeof p.lon === 'number' && typeof p.lat === 'number' && !isNaN(p.lon) && !isNaN(p.lat))
      .map(p => [p.lon, p.lat]);

    if (coordinates.length === 0) {
      console.warn(`No valid points found in track from ${fileName}`);
      return null;
    }

    const bounds = calculateBounds(coordinates);

    let distance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [lon1, lat1] = coordinates[i - 1];
      const [lon2, lat2] = coordinates[i];
      distance += calculateDistance(lat1, lon1, lat2, lon2);
    }
    const distanceMiles = distance * 0.621371;

    const startTime = track.points[0]?.time ? new Date(track.points[0].time) : new Date();
    const endTime = track.points[track.points.length - 1]?.time
      ? new Date(track.points[track.points.length - 1].time)
      : new Date();

    const durationSeconds = (endTime - startTime) / 1000;
    const durationMinutes = durationSeconds / 60;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.floor(durationMinutes % 60);
    const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const formattedDate = startTime.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    return {
      name: track.name || fileName,
      time: track.points[0]?.time || new Date().toISOString(),
      date: formattedDate,
      timeOfDay: formattedTime,
      duration: formattedDuration,
      durationSeconds,
      coordinates,
      bounds,
      distance: distanceMiles.toFixed(2),
    };
  } catch (error) {
    console.error(`Error parsing GPX file ${fileName}:`, error);
    return null;
  }
}
