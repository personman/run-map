import React, { useState, useRef } from 'react';
import FixedAnimation from './components/FixedAnimation';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [activities, setActivities] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [useProportionalSpeed, setUseProportionalSpeed] = useState(false);
  
  const handleFilesUploaded = (parsedActivities) => {
    console.log('Activities loaded:', parsedActivities.length);
    setActivities(parsedActivities);
  };
  
  const startAnimation = () => {
    if (activities.length > 0) {
      console.log('App: Starting animation');
      setIsAnimating(false); // Reset first
      setTimeout(() => {
        setIsAnimating(true); // Then start fresh
      }, 50);
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

  return (
    <div className="app">
      <div className="controls">
        <h1>Strava Run Maps</h1>
        <FileUploader onFilesUploaded={handleFilesUploaded} />
        <div className="buttons">
          <button 
            onClick={startAnimation} 
            disabled={activities.length === 0 || isAnimating}
          >
            Start Animation
          </button>
          <button 
            onClick={resetAnimation} 
            disabled={!isAnimating}
          >
            Reset
          </button>
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
    </div>
  );
}

export default App;