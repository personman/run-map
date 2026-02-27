import React, { useState } from 'react';
import FixedAnimation from './components/FixedAnimation';
import FileUploader from './components/FileUploader';
import SaveGroupModal from './components/SaveGroupModal';
import StravaConnect from './components/StravaConnect';
import { useGroupLoader } from './hooks/useGroupLoader.js';
import { parseGpxText } from './utils/gpxParser.js';
import './App.css';

const EXAMPLE_FILES = [
  'Lunch_Run.gpx',
  'Lunch_Run (1).gpx',
  'Lunch_Run (2).gpx',
  'Lunch_Run (3).gpx',
  'Lunch_Run (4).gpx',
  'Morning_Run.gpx',
  'Morning_Run (1).gpx',
];

function App() {
  const [activities, setActivities] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [useProportionalSpeed, setUseProportionalSpeed] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Merge new activities with existing ones, dedup by time+name, then sort
  const handleFilesUploaded = (parsedActivities) => {
    console.log('Activities loaded:', parsedActivities.length);
    setActivities((prev) => {
      const merged = [...prev, ...parsedActivities];
      const seen = new Set();
      const unique = merged.filter((a) => {
        const key = `${a.time}|${a.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      unique.sort((a, b) => new Date(a.time) - new Date(b.time));
      return unique;
    });
  };

  const { groupId, groupName, loading: groupLoading, error: groupError } =
    useGroupLoader(handleFilesUploaded);

  const startAnimation = () => {
    if (activities.length > 0) {
      console.log('App: Starting animation');
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 50);
    }
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setCurrentActivity(null);
    setAnimationProgress(0);
  };

  const handleAnimationUpdate = (activity, progress) => {
    setCurrentActivity(activity);
    setAnimationProgress(progress);
  };

  const [examplesLoading, setExamplesLoading] = useState(false);

  const loadExamples = async () => {
    setExamplesLoading(true);
    const parsed = [];
    for (const name of EXAMPLE_FILES) {
      try {
        const res = await fetch(`/examples/${encodeURIComponent(name)}`);
        if (!res.ok) continue;
        const text = await res.text();
        const activity = parseGpxText(text, name);
        if (activity) parsed.push(activity);
      } catch (e) {
        console.warn('Failed to load example:', name, e);
      }
    }
    if (parsed.length > 0) handleFilesUploaded(parsed);
    setExamplesLoading(false);
  };

  const isGroupUrl = Boolean(groupId);

  return (
    <div className="app">
      <div className="controls">
        <div className="brand-header">
          <img src="/favicon.png" alt="" className="brand-icon" />
          <h1>MileTracer</h1>
        </div>

        {groupLoading && <p className="group-loading">Loading map…</p>}
        {groupError && <p className="group-error">Failed to load map: {groupError}</p>}
        {groupName && !groupLoading && (
          <p className="group-name"><strong>{groupName}</strong></p>
        )}

        {!isGroupUrl && activities.length === 0 && (
          <div className="upload-row">
            <StravaConnect onActivitiesImported={handleFilesUploaded} />
            <FileUploader onFilesUploaded={handleFilesUploaded} />
            <button
              onClick={loadExamples}
              disabled={examplesLoading}
              className="button-secondary"
            >
              {examplesLoading ? 'Loading…' : 'Load Examples'}
            </button>
          </div>
        )}

        {activities.length > 0 && !isAnimating && (
          <div className="buttons">
            <button onClick={startAnimation}>Start Animation</button>
            {!isGroupUrl && (
              <button onClick={() => setShowSaveModal(true)}>Save Map</button>
            )}
            <button className="button-secondary" onClick={() => { setActivities([]); setCurrentActivity(null); setAnimationProgress(0); }}>Start Over</button>
          </div>
        )}

        {isAnimating && (
          <div className="animation-options">
            <div className="speed-row">
              <button onClick={resetAnimation}>Reset</button>
            </div>
          </div>
        )}

        {activities.length > 0 && (() => {
          const totalMiles = activities.reduce((s, a) => s + parseFloat(a.distance), 0);
          const totalSec = activities.reduce((s, a) => s + (a.durationSeconds || 0), 0);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
          return (
            <div className="info">
              <p>{activities.length} activities · {totalMiles.toFixed(1)} mi · {timeStr}</p>
            </div>
          );
        })()}
      </div>

      {activities.length > 0 && <div className="map-wrapper">
        <FixedAnimation
          activities={activities}
          isAnimating={isAnimating}
          onAnimationComplete={resetAnimation}
          onAnimationUpdate={handleAnimationUpdate}
          useProportionalSpeed={useProportionalSpeed}
        />
        {currentActivity && isAnimating && (
          <div className="animation-overlay">
            <div className="animation-status">
              <div className="activity-header">
                <div className="activity-info">
                  <h3 className="activity-title">{currentActivity.name}</h3>
                  <div className="activity-date-time">
                    {currentActivity.date} • {currentActivity.timeOfDay}
                  </div>
                </div>
                <div className="activity-details">
                  <div className="activity-distance">{currentActivity.distance} miles</div>
                  <div className="activity-duration">{currentActivity.duration}</div>
                </div>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${animationProgress * 100}%` }}
                ></div>
                <div className="progress-text">
                  {(animationProgress * parseFloat(currentActivity.distance)).toFixed(2)} / {currentActivity.distance} miles
                </div>
              </div>
            </div>
          </div>
        )}
      </div>}

      {showSaveModal && (
        <SaveGroupModal
          activities={activities}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

export default App;
