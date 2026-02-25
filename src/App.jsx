import React, { useState } from 'react';
import FixedAnimation from './components/FixedAnimation';
import FileUploader from './components/FileUploader';
import SaveGroupModal from './components/SaveGroupModal';
import StravaConnect from './components/StravaConnect';
import { useGroupLoader } from './hooks/useGroupLoader.js';
import './App.css';

function App() {
  const [activities, setActivities] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [useProportionalSpeed, setUseProportionalSpeed] = useState(false);
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

  const isGroupUrl = Boolean(groupId);

  return (
    <div className="app">
      <div className="controls">
        <h1>Activity Maps</h1>

        {groupLoading && <p className="group-loading">Loading group…</p>}
        {groupError && <p className="group-error">Failed to load group: {groupError}</p>}
        {groupName && !groupLoading && (
          <p className="group-name">Group: <strong>{groupName}</strong></p>
        )}

        {!isGroupUrl && (
          <>
            <FileUploader onFilesUploaded={handleFilesUploaded} />
            <StravaConnect onActivitiesImported={handleFilesUploaded} />
          </>
        )}

        <div className="buttons">
          <button
            onClick={startAnimation}
            disabled={activities.length === 0 || isAnimating}
          >
            Start Animation
          </button>
          <button onClick={resetAnimation} disabled={!isAnimating}>
            Reset
          </button>
          {activities.length > 0 && !isGroupUrl && (
            <button onClick={() => setShowSaveModal(true)} disabled={isAnimating}>
              Save Group
            </button>
          )}
        </div>

        <div className="animation-options">
          <div className="option-title">Animation Speed:</div>
          <div className="radio-options">
            <label className="radio-label">
              <input
                type="radio"
                name="speedOption"
                checked={!useProportionalSpeed}
                onChange={() => setUseProportionalSpeed(false)}
                disabled={isAnimating}
              />
              <span>Fixed (2 sec each)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="speedOption"
                checked={useProportionalSpeed}
                onChange={() => setUseProportionalSpeed(true)}
                disabled={isAnimating}
              />
              <span>Proportional to duration</span>
            </label>
          </div>
        </div>

        <div className="info">
          <p>{activities.length} activities loaded</p>
          {currentActivity && isAnimating && (
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
          )}

          <div className="debug-info">
            <details>
              <summary>Debug Info</summary>
              <pre>
                {JSON.stringify({
                  activitiesLoaded: activities.length,
                  isAnimating,
                  groupId,
                  currentActivity: currentActivity ? {
                    name: currentActivity.name,
                    coordinatesCount: currentActivity.coordinates.length
                  } : null,
                  animationProgress: Math.round(animationProgress * 100) / 100
                }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>

      <FixedAnimation
        activities={activities}
        isAnimating={isAnimating}
        onAnimationComplete={resetAnimation}
        onAnimationUpdate={handleAnimationUpdate}
        useProportionalSpeed={useProportionalSpeed}
      />

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
