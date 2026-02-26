import React, { useRef } from 'react';
import { parseGpxText } from '../utils/gpxParser.js';
import { logImport } from '../services/api.js';

const FileUploader = ({ onFilesUploaded }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const activities = [];

    for (const file of files) {
      try {
        const gpxText = await readFileAsText(file);
        const parsedActivity = parseGpxText(gpxText, file.name);
        if (parsedActivity) {
          activities.push(parsedActivity);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    activities.sort((a, b) => new Date(a.time) - new Date(b.time));
    if (activities.length > 0) {
      const totalMiles = activities.reduce((s, a) => s + parseFloat(a.distance || 0), 0);
      logImport('gpx', activities.length, totalMiles);
    }
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
    </div>
  );
};

export default FileUploader;
