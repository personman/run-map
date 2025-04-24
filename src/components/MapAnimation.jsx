import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import config from '../config/config';

// Set Mapbox token from config
mapboxgl.accessToken = config.mapbox.accessToken;

const MapAnimation = ({ activities, isAnimating, onAnimationComplete, onAnimationUpdate }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const animationRef = useRef(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, zoom-in, animate, zoom-out
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: config.mapbox.style,
        center: config.mapbox.defaultCenter,
        zoom: config.mapbox.defaultZoom,
        interactive: true, // Will be disabled during animation
        attributionControl: true,
        preserveDrawingBuffer: true // Important for animation rendering
      });

      // Set up event handlers
      mapRef.current.on('load', () => {
        console.log('Map loaded');
        
        try {
          // Add sources and layers
          mapRef.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          mapRef.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#fc5200', // Strava orange
              'line-width': 6,
              'line-opacity': 0.9
            }
          });

          // Add a glow effect for the route
          mapRef.current.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ff9966',
              'line-width': 12,
              'line-opacity': 0.3,
              'line-blur': 3
            }
          }, 'route-line');

          mapRef.current.addSource('current-point', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: []
              }
            }
          });

          mapRef.current.addLayer({
            id: 'current-point-glow',
            type: 'circle',
            source: 'current-point',
            paint: {
              'circle-radius': 12,
              'circle-color': '#fc5200',
              'circle-opacity': 0.4,
              'circle-blur': 1
            }
          });

          mapRef.current.addLayer({
            id: 'current-point',
            type: 'circle',
            source: 'current-point',
            paint: {
              'circle-radius': 8,
              'circle-color': '#fc5200',
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff'
            }
          });
          
          // Mark map as loaded and ready
          setMapLoaded(true);
          
          // If activities are already loaded, fit map to show them
          if (activities.length > 0) {
            resetAnimation();
          }
        } catch (error) {
          console.error('Error setting up map layers:', error);
        }
      });
      
      // Add error handling
      mapRef.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
      
      // Add style handling
      mapRef.current.on('style.load', () => {
        console.log('Map style loaded');
      });
      
      // Add data handling
      mapRef.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded && (e.sourceId === 'route' || e.sourceId === 'current-point')) {
          console.log(`Source ${e.sourceId} loaded:`, e);
        }
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Reset animation when activities change
  useEffect(() => {
    if (activities.length > 0 && mapRef.current && mapLoaded) {
      console.log('Activities changed, resetting animation');
      resetAnimation();
    }
  }, [activities, mapLoaded]);

  // Animation control
  useEffect(() => {
    if (!mapRef.current || activities.length === 0 || !mapLoaded) return;

    if (isAnimating) {
      console.log('Starting animation');
      
      // Log the first activity to debug
      console.log('First activity for animation:', {
        name: activities[0].name,
        coordinates: activities[0].coordinates.slice(0, 10),
        totalPoints: activities[0].coordinates.length,
        bounds: activities[0].bounds
      });
      
      // Disable map interactivity during animation
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.dragRotate.disable();
      mapRef.current.keyboard.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
      
      // IMPORTANT: Force animation phase to zoom-in to start the sequence properly
      setAnimationPhase('zoom-in');
      
      startAnimation();
    } else {
      console.log('Stopping animation');
      
      // Re-enable map interactivity
      mapRef.current.dragPan.enable();
      mapRef.current.scrollZoom.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.dragRotate.enable();
      mapRef.current.keyboard.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.touchZoomRotate.enable();
      
      stopAnimation();
      resetAnimation();
    }

    return () => {
      if (mapRef.current) {
        // Re-enable map interactivity
        mapRef.current.dragPan.enable();
        mapRef.current.scrollZoom.enable();
        mapRef.current.boxZoom.enable();
        mapRef.current.dragRotate.enable();
        mapRef.current.keyboard.enable();
        mapRef.current.doubleClickZoom.enable();
        mapRef.current.touchZoomRotate.enable();
      }
      stopAnimation();
    };
  }, [isAnimating, activities, mapLoaded]);

  const resetAnimation = () => {
    if (!mapRef.current || !mapLoaded) {
      console.log("Can't reset animation - map not ready");
      return;
    }
    
    console.log("Resetting animation");
    
    setCurrentActivityIndex(0);
    setAnimationProgress(0);
    setAnimationPhase('idle');
    
    try {
      // Check if the sources exist
      if (mapRef.current.getSource('route')) {
        // Reset the route line
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      } else {
        console.error("Route source doesn't exist during reset");
      }
      
      if (mapRef.current.getSource('current-point')) {
        // Reset the current point
        mapRef.current.getSource('current-point').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: []
          }
        });
      } else {
        console.error("Current-point source doesn't exist during reset");
      }
      
      // If we have activities, fit map to show all of them
      if (activities.length > 0) {
        console.log(`Fitting map to show ${activities.length} activities`);
        
        // Show the first route completely to debug
        if (mapRef.current.getSource('route') && activities[0].coordinates.length > 0) {
          mapRef.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: activities[0].coordinates
            }
          });
        }
        
        const bounds = new mapboxgl.LngLatBounds();
        
        activities.forEach(activity => {
          bounds.extend([activity.bounds.sw[0], activity.bounds.sw[1]]);
          bounds.extend([activity.bounds.ne[0], activity.bounds.ne[1]]);
        });
        
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          duration: 0
        });
      }
    } catch (error) {
      console.error('Error in resetAnimation:', error);
    }
  };

  const startAnimation = () => {
    if (!mapRef.current || activities.length === 0) return;
    
    console.log('Animation starting with phase:', animationPhase);
    
    // Force animation to properly start
    stopAnimation(); // Cancel any existing animation frame
    
    // Force the animation to start properly
    setAnimationPhase('zoom-in');
    setAnimationProgress(0);
    setCurrentActivityIndex(0);
    
    // Make sure we grab the first activity from the array
    const activity = activities[0]; // Use index 0 instead of currentActivityIndex which might not be updated yet
    console.log('Drawing initial route for:', activity.name);
    
    try {
      // Draw the complete route first just to verify it works
      if (mapRef.current.getSource('route')) {
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activity.coordinates
          }
        });
      } else {
        console.error('Route source not available');
      }
      
      // Set the current point to the first point
      if (activity.coordinates.length > 0 && mapRef.current.getSource('current-point')) {
        mapRef.current.getSource('current-point').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: activity.coordinates[0]
          }
        });
      }
    } catch (error) {
      console.error('Error drawing initial route:', error);
    }
    
    // Start the animation loop with a slight delay to ensure state updates
    setTimeout(() => {
      console.log('Starting animation loop');
      animationRef.current = requestAnimationFrame(animateFrame);
    }, 100);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const animateFrame = (timestamp) => {
    // Store the animation phase in a local variable to ensure it's current
    let currentPhase = animationPhase;
    
    // Debug log the initial call
    console.log('animateFrame called', { 
      timestamp, 
      mapReady: !!mapRef.current, 
      activitiesLength: activities.length,
      mapLoaded,
      currentPhase, 
      animationProgress
    });
    
    if (!mapRef.current || !activities.length || !mapLoaded) {
      // If map is not loaded yet, retry animation in the next frame
      console.log('Map not ready for animation, retrying...');
      animationRef.current = requestAnimationFrame(animateFrame);
      return;
    }
    
    // Check if map style is loaded
    if (!mapRef.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, retrying...');
      animationRef.current = requestAnimationFrame(animateFrame);
      return;
    }
    
    // Check sources individually with better error messages
    try {
      if (!mapRef.current.getSource('route')) {
        console.log('Route source not loaded yet, retrying...');
        // Try to recreate the source if it's missing
        mapRef.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
      
      if (!mapRef.current.getSource('current-point')) {
        console.log('Current-point source not loaded yet, retrying...');
        // Try to recreate the source if it's missing
        mapRef.current.addSource('current-point', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: []
            }
          }
        });
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
      
      // Check if the layers exist and recreate them if needed
      if (!mapRef.current.getLayer('route-line')) {
        console.log('Route-line layer missing, recreating...');
        
        // Add the route-glow layer first
        if (!mapRef.current.getLayer('route-glow')) {
          mapRef.current.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ff9966',
              'line-width': 12,
              'line-opacity': 0.3,
              'line-blur': 3
            }
          });
        }
        
        // Add the route-line layer
        mapRef.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#fc5200', // Strava orange
            'line-width': 6,
            'line-opacity': 0.9
          }
        });
        
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
      
      if (!mapRef.current.getLayer('current-point')) {
        console.log('Current-point layer missing, recreating...');
        
        // Add the point glow layer first
        if (!mapRef.current.getLayer('current-point-glow')) {
          mapRef.current.addLayer({
            id: 'current-point-glow',
            type: 'circle',
            source: 'current-point',
            paint: {
              'circle-radius': 12,
              'circle-color': '#fc5200',
              'circle-opacity': 0.4,
              'circle-blur': 1
            }
          });
        }
        
        // Add the current-point layer
        mapRef.current.addLayer({
          id: 'current-point',
          type: 'circle',
          source: 'current-point',
          paint: {
            'circle-radius': 8,
            'circle-color': '#fc5200',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
    } catch (error) {
      console.error('Error checking or recreating sources:', error);
      animationRef.current = requestAnimationFrame(animateFrame);
      return;
    }
    
    const activity = activities[currentActivityIndex];
    console.log('Animation frame', {
      phase: animationPhase,
      currentActivityIndex,
      progress: animationProgress,
      activityName: activity.name,
      coordinatesLength: activity.coordinates.length
    });
    
    // Animation phases:
    // 1. zoom-in: Zoom to current activity
    // 2. animate: Animate the activity route
    // 3. zoom-out: Zoom out to show all activities
    // Then repeat for next activity or complete
    
    if (animationPhase === 'zoom-in') {
      // Report start of activity to parent component
      if (onAnimationUpdate) {
        onAnimationUpdate(activity, 0);
      }
      
      // DEBUG: Show the entire route immediately to verify source update works
      // This is temporary for debugging
      try {
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activity.coordinates
          }
        });
      } catch (error) {
        console.error('Error setting full route data for debugging:', error);
      }
      
      const bounds = new mapboxgl.LngLatBounds(
        [activity.bounds.sw[0], activity.bounds.sw[1]],
        [activity.bounds.ne[0], activity.bounds.ne[1]]
      );
      
      // Ensure bounds are valid
      if (bounds.isEmpty()) {
        console.error('Invalid bounds for activity', activity.name);
        setAnimationPhase('animate');
        setAnimationProgress(0);
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
      
      try {
        mapRef.current.fitBounds(bounds, {
          padding: config.animation.padding,
          duration: config.animation.zoomDuration
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
      
      // After zoom duration, start animating the route
      setTimeout(() => {
        console.log('Starting route animation');
        
        // Force the animation phase directly without React state to ensure immediate effect
        animationPhase = 'animate';
        
        // Clear route first, then we'll animate it
        try {
          mapRef.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        } catch (error) {
          console.error('Error clearing route before animation:', error);
        }
        
        // Make sure first point is set
        if (activity.coordinates.length > 0) {
          try {
            mapRef.current.getSource('current-point').setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: activity.coordinates[0]
              }
            });
          } catch (error) {
            console.error('Error setting initial point:', error);
          }
        }
        
        // Update React state (may happen asynchronously)
        setAnimationPhase('animate');
        setAnimationProgress(0);
        
        // Force animation frame to continue immediately
        animationRef.current = requestAnimationFrame(animateFrame);
      }, config.animation.zoomDuration);
    }
    else if (animationPhase === 'animate') {
      // Use the speed from config
      const INCREMENT = config.animation.speed;
      
      // Increment animation progress
      setAnimationProgress(prev => {
        const newProgress = prev + INCREMENT;
        
        // Report progress to parent component
        if (onAnimationUpdate) {
          onAnimationUpdate(activity, newProgress);
        }
        
        if (newProgress >= 1) {
          // Animation for current activity is complete
          console.log('Activity animation complete');
          setAnimationPhase('zoom-out');
          return 1;
        }
        
        return newProgress;
      });
      
      // Calculate how many points to show based on progress
      const coordinates = activity.coordinates;
      
      if (!coordinates || coordinates.length === 0) {
        console.error('No coordinates for activity', activity.name);
        setAnimationPhase('zoom-out');
        animationRef.current = requestAnimationFrame(animateFrame);
        return;
      }
      
      const pointIndex = Math.floor(animationProgress * coordinates.length);
      const visibleCoordinates = coordinates.slice(0, pointIndex + 1);
      
      // Only log every 100 frames to reduce console spam
      if (pointIndex % 100 === 0) {
        console.log('Updating route line', {
          pointIndex,
          progress: animationProgress,
          visibleCoordinatesLength: visibleCoordinates.length,
          lastCoord: visibleCoordinates.length > 0 ? visibleCoordinates[visibleCoordinates.length - 1] : null
        });
      }
      
      // Validate coordinates before updating
      if (visibleCoordinates.length > 0) {
        try {
          // Update the route line
          mapRef.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: visibleCoordinates
            }
          });
          
          // Update current point position
          if (visibleCoordinates.length > 0) {
            const currentPoint = visibleCoordinates[visibleCoordinates.length - 1];
            mapRef.current.getSource('current-point').setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: currentPoint
              }
            });
          }
        } catch (error) {
          console.error('Error updating map data:', error);
        }
      } else {
        console.error('Invalid coordinates for animation');
      }
    }
    else if (animationPhase === 'zoom-out') {
      // Zoom out to show all activities
      const bounds = new mapboxgl.LngLatBounds();
      
      activities.forEach(activity => {
        bounds.extend([activity.bounds.sw[0], activity.bounds.sw[1]]);
        bounds.extend([activity.bounds.ne[0], activity.bounds.ne[1]]);
      });
      
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 2000
      });
      
      // After zooming out, move to the next activity or complete
      setTimeout(() => {
        if (currentActivityIndex < activities.length - 1) {
          // Move to next activity
          const nextIndex = currentActivityIndex + 1;
          setCurrentActivityIndex(nextIndex);
          setAnimationProgress(0);
          setAnimationPhase('zoom-in');
          
          // Report next activity to parent component
          if (onAnimationUpdate) {
            onAnimationUpdate(activities[nextIndex], 0);
          }
        } else {
          // Animation complete
          setAnimationPhase('idle');
          if (onAnimationUpdate) {
            onAnimationUpdate(null, 0);
          }
          onAnimationComplete();
        }
      }, config.animation.zoomDuration);
    }
    
    // Always continue animation if isAnimating is true, regardless of phase
    if (isAnimating) {
      // Force animation to continue
      console.log(`Animation continues: phase=${currentPhase}, progress=${animationProgress.toFixed(3)}, forcing next frame`);
      animationRef.current = requestAnimationFrame(animateFrame);
    } else {
      console.log('Animation stopped - no requestAnimationFrame called');
    }
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="map-container" 
    />
  );
};

export default MapAnimation;