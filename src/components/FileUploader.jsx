import React, { useRef } from 'react';
import GpxParser from 'gpxparser';

// Function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const FileUploader = ({ onFilesUploaded }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    const activities = [];
    
    for (const file of files) {
      try {
        const gpxText = await readFileAsText(file);
        const parsedActivity = parseGpxFile(gpxText, file.name);
        if (parsedActivity) {
          activities.push(parsedActivity);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    // Sort activities by date
    activities.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    onFilesUploaded(activities);
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const parseGpxFile = (gpxText, fileName) => {
    try {
      const gpx = new GpxParser();
      gpx.parse(gpxText);
      
      console.log(`Parsing GPX file: ${fileName}`, {
        tracks: gpx.tracks.length,
        metadata: gpx.metadata,
      });
      
      if (gpx.tracks.length === 0) {
        console.warn(`No tracks found in ${fileName}`);
        return null;
      }
      
      const track = gpx.tracks[0];
      
      console.log(`Track data for ${fileName}`, {
        name: track.name,
        points: track.points.length,
        samplePoint: track.points.length > 0 ? track.points[0] : null,
      });
      
      // Extract coordinates from track points and make sure they're valid
      const coordinates = track.points
        .filter(point => 
          typeof point.lon === 'number' && 
          typeof point.lat === 'number' && 
          !isNaN(point.lon) && 
          !isNaN(point.lat)
        )
        .map(point => [point.lon, point.lat]);
      
      if (coordinates.length === 0) {
        console.warn(`No valid points found in track from ${fileName}`);
        return null;
      }
      
      // Log first and last few coordinates for debugging
      console.log('First 3 coordinates:', coordinates.slice(0, 3));
      console.log('Last 3 coordinates:', coordinates.slice(-3));
      
      // Calculate bounds
      const bounds = calculateBounds(coordinates);
      
      console.log(`Processed coordinates for ${fileName}`, {
        count: coordinates.length,
        first: coordinates[0],
        last: coordinates[coordinates.length - 1],
        bounds: bounds
      });
      
      // Calculate total distance in kilometers
      let distance = 0;
      if (coordinates.length > 1) {
        for (let i = 1; i < coordinates.length; i++) {
          const [lon1, lat1] = coordinates[i-1];
          const [lon2, lat2] = coordinates[i];
          distance += calculateDistance(lat1, lon1, lat2, lon2);
        }
      }
      
      // Convert to miles if needed
      const distanceMiles = distance * 0.621371;
      
      // Extract date and time information
      const startTime = track.points[0]?.time ? new Date(track.points[0].time) : new Date();
      const endTime = track.points[track.points.length - 1]?.time ? new Date(track.points[track.points.length - 1].time) : new Date();
      
      // Calculate activity duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      const durationMinutes = durationSeconds / 60;
      
      // Format duration for display
      const hours = Math.floor(durationMinutes / 60);
      const minutes = Math.floor(durationMinutes % 60);
      const formattedDuration = hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`;
      
      // Format date: e.g., "Apr 15, 2023"
      const formattedDate = startTime.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Format time: e.g., "9:30 AM"
      const formattedTime = startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return {
        name: track.name || fileName,
        time: track.points[0]?.time || new Date().toISOString(),
        date: formattedDate,
        timeOfDay: formattedTime,
        duration: formattedDuration,
        durationSeconds: durationSeconds,
        coordinates,
        bounds,
        distance: distanceMiles.toFixed(2) // Distance in miles
      };
    } catch (error) {
      console.error(`Error parsing GPX file ${fileName}:`, error);
      return null;
    }
  };

  const calculateBounds = (coordinates) => {
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    return {
      sw: [Math.min(...lngs), Math.min(...lats)],
      ne: [Math.max(...lngs), Math.max(...lats)]
    };
  };

  return (
    <div className="file-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".gpx"
        multiple
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current.click()}>
        Upload GPX Files
      </button>
      <p className="info-text">Select multiple .gpx files from your running activities</p>
    </div>
  );
};

export default FileUploader;