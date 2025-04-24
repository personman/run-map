import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import config, { isConfigReady } from '../config/config';

const FixedAnimation = ({ activities, isAnimating, onAnimationComplete, onAnimationUpdate, useProportionalSpeed }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const animationRef = useRef(null);
  const progressRef = useRef(0);
  const activityIndexRef = useRef(0);
  const phaseRef = useRef('idle');
  const [mapReady, setMapReady] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Check if config is loaded properly (specifically the Mapbox token)
  useEffect(() => {
    const checkConfig = async () => {
      try {
        // Wait for the config to be ready
        const ready = await isConfigReady();
        
        if (ready) {
          console.log('Mapbox token loaded properly:', config.mapbox.accessToken.slice(0, 5) + '...');
          console.log('Config center coordinates:', config.mapbox.defaultCenter);
          
          // Make sure we have valid center coordinates
          if (!Array.isArray(config.mapbox.defaultCenter) || 
              config.mapbox.defaultCenter.length !== 2 ||
              isNaN(config.mapbox.defaultCenter[0]) ||
              isNaN(config.mapbox.defaultCenter[1])) {
            console.warn('Invalid center coordinates, setting default coordinates');
            config.mapbox.defaultCenter = [-74.0060, 40.7128]; // NYC coordinates
          }
          
          setConfigLoaded(true);
        } else {
          // Retry after a short delay
          console.warn('Mapbox token not loaded yet, retrying...');
          setTimeout(checkConfig, 300);
        }
      } catch (error) {
        console.error('Error checking config:', error);
        setTimeout(checkConfig, 300);
      }
    };
    
    console.log('Starting config check...');
    checkConfig();
  }, []);

  // Initialize map only after config is loaded
  useEffect(() => {
    if (!mapContainerRef.current || !configLoaded) return;
    
    // Set Mapbox token from config
    mapboxgl.accessToken = config.mapbox.accessToken;

    console.log('Initializing map with center:', config.mapbox.defaultCenter);
    
    try {
      // Use fallbacks for map initialization
      // Ensure valid center coordinates
      const defaultCenter = Array.isArray(config.mapbox.defaultCenter) && 
                           config.mapbox.defaultCenter.length === 2 && 
                           !isNaN(config.mapbox.defaultCenter[0]) && 
                           !isNaN(config.mapbox.defaultCenter[1]) 
                         ? config.mapbox.defaultCenter 
                         : [-74.0060, 40.7128]; // NYC coordinates as fallback
                         
      // Ensure valid map style
      const mapStyle = typeof config.mapbox.style === 'string' && config.mapbox.style.trim() !== ''
                      ? config.mapbox.style
                      : 'mapbox://styles/mapbox/outdoors-v12'; // Default outdoors style
      
      console.log('Using center coordinates:', defaultCenter);
      console.log('Using map style:', mapStyle);
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: defaultCenter,
        zoom: config.mapbox.defaultZoom || 9,
        interactive: true,
        attributionControl: true,
        preserveDrawingBuffer: true
      });

      mapRef.current.on('load', () => {
        console.log('Map loaded');
        
        try {
          // Add sources
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
          
          // Add source for completed routes
          mapRef.current.addSource('completed-routes', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
          
          // Add layers
          // First add the completed routes layer (so it's below the active route)
          mapRef.current.addLayer({
            id: 'completed-routes',
            type: 'line',
            source: 'completed-routes',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#8b5cf6', // Purple throughout
              'line-width': [
                'case',
                ['==', ['get', 'finalView'], true], 5, // Slightly thicker for final view
                4
              ],
              'line-opacity': [
                'case',
                ['==', ['get', 'finalView'], true], 0.9, // Full strength for final view
                0.4 // Faded during animation
              ]
            }
          });
          
          // Active route glow effect
          mapRef.current.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#c4b5fd', // Light purple
              'line-width': 12,
              'line-opacity': 0.3,
              'line-blur': 3
            }
          });
          
          // Active route line
          mapRef.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#8b5cf6', // Bright purple
              'line-width': 6,
              'line-opacity': 0.9
            }
          });
          
          mapRef.current.addLayer({
            id: 'current-point-glow',
            type: 'circle',
            source: 'current-point',
            paint: {
              'circle-radius': 12,
              'circle-color': '#8b5cf6', // Purple
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
              'circle-color': '#8b5cf6', // Purple
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff'
            }
          });
          
          setMapReady(true);
          console.log('Map sources and layers ready');
        } catch (error) {
          console.error('Error setting up sources and layers:', error);
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
  }, [configLoaded]);

  // Handle activities changes
  useEffect(() => {
    if (activities.length > 0 && mapRef.current && mapReady) {
      console.log('Activities loaded, fitting map');
      fitMapToActivities();
    }
  }, [activities, mapReady]);

  // Handle animation control
  useEffect(() => {
    if (!mapRef.current || !mapReady || activities.length === 0) return;

    if (isAnimating) {
      console.log('Starting animation');
      startAnimation();
    } else {
      console.log('Stopping animation');
      stopAnimation();
      resetAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isAnimating, activities, mapReady]);

  const fitMapToActivities = () => {
    if (!mapRef.current || activities.length === 0) return;
    
    try {
      const bounds = new mapboxgl.LngLatBounds();
      
      activities.forEach(activity => {
        bounds.extend([activity.bounds.sw[0], activity.bounds.sw[1]]);
        bounds.extend([activity.bounds.ne[0], activity.bounds.ne[1]]);
      });
      
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 0
      });
      
      // Show all activities in full strength 
      const features = activities.map((activity, index) => ({
        type: 'Feature',
        properties: {
          name: activity.name,
          activityIndex: index,
          finalView: true // Set all to full strength by default
        },
        geometry: {
          type: 'LineString',
          coordinates: activity.coordinates
        }
      }));
      
      // Update the completed routes source with all activities
      if (mapRef.current.getSource('completed-routes')) {
        mapRef.current.getSource('completed-routes').setData({
          type: 'FeatureCollection',
          features: features
        });
      }
      
      // Clear the active route
      if (mapRef.current.getSource('route')) {
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    } catch (error) {
      console.error('Error fitting map to activities:', error);
    }
  };

  const resetAnimation = () => {
    progressRef.current = 0;
    activityIndexRef.current = 0;
    phaseRef.current = 'idle';
    
    if (mapRef.current && mapReady) {
      // Don't clear completed routes, just keep them visible
      
      // Make sure all routes are full strength
      const completedSource = mapRef.current.getSource('completed-routes');
      const completedData = completedSource._data || { type: 'FeatureCollection', features: [] };
      
      // Ensure all features have finalView=true for full strength rendering
      const finalFeatures = completedData.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          finalView: true
        }
      }));
      
      // Update the source again to ensure all are at full strength
      completedSource.setData({
        type: 'FeatureCollection',
        features: finalFeatures
      });
      
      // Clear active route
      mapRef.current.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
      
      // Clear current point
      mapRef.current.getSource('current-point').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: []
        }
      });
      
      // Fit map to show all activities
      fitMapToActivities();
    }
  };

  const startAnimation = () => {
    // Cancel any existing animation
    stopAnimation();
    
    // Reset animation state
    progressRef.current = 0;
    activityIndexRef.current = 0;
    phaseRef.current = 'zoom-in';
    
    if (mapRef.current && activities.length > 0) {
      try {
        // Clear active route at start (we'll animate it)
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
        
        // Clear completed routes only when starting a fresh animation
        mapRef.current.getSource('completed-routes').setData({
          type: 'FeatureCollection',
          features: [] // Start with no features
        });
        
        // Set initial marker at first point of first activity
        const firstActivity = activities[0];
        if (firstActivity.coordinates.length > 0) {
          mapRef.current.getSource('current-point').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: firstActivity.coordinates[0]
            }
          });
        }
        
        // Start with larger padding for better visibility
        const bounds = new mapboxgl.LngLatBounds(
          [firstActivity.bounds.sw[0], firstActivity.bounds.sw[1]],
          [firstActivity.bounds.ne[0], firstActivity.bounds.ne[1]]
        );
        
        // Fit map to first activity with padding
        mapRef.current.fitBounds(bounds, {
          padding: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          },
          duration: 500 // Short duration for initial zoom
        });
      } catch (error) {
        console.error('Error setting up animation:', error);
      }
    }
    
    // Start the animation loop
    console.log('Starting animation loop from scratch');
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animateFrame);
    }, 500); // Small delay to ensure map is ready
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const animateFrame = (timestamp) => {
    if (!mapRef.current || !mapReady || activities.length === 0) {
      console.log('Map not ready for animation');
      return;
    }
    
    const activity = activities[activityIndexRef.current];
    const phase = phaseRef.current;
    
    console.log(`Animation frame: phase=${phase}, activity=${activity.name}, progress=${progressRef.current.toFixed(3)}`);
    
    // Only update if we're in the animate phase (not during transitions)
    // This ensures progress resets properly between activities
    if (onAnimationUpdate) {
      if (phase === 'animate') {
        onAnimationUpdate(activity, progressRef.current);
      } else if (phase === 'zoom-in' || phase === 'waiting') {
        // When switching activities, force progress to 0
        onAnimationUpdate(activity, 0);
      }
    }
    
    // Phase 1: Zoom to current activity
    if (phase === 'zoom-in') {
      // Calculate padding to ensure the whole route is visible
      const bounds = new mapboxgl.LngLatBounds(
        [activity.bounds.sw[0], activity.bounds.sw[1]],
        [activity.bounds.ne[0], activity.bounds.ne[1]]
      );
      
      // Use a larger padding to ensure the whole route stays visible
      const routePadding = {
        top: 100,
        bottom: 150, // Increased bottom padding to avoid routes being cut off
        left: 100,
        right: 100
      };
      
      mapRef.current.fitBounds(bounds, {
        padding: routePadding,
        duration: config.animation.zoomDuration
      });
      
      // After zooming in, start animating
      phaseRef.current = 'animate';
      progressRef.current = 0;
      
      // Draw first point
      if (activity.coordinates.length > 0) {
        mapRef.current.getSource('current-point').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: activity.coordinates[0]
          }
        });
      }

      // Clear any existing route
      mapRef.current.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
    // Phase 2: Animate the route
    else if (phase === 'animate') {
      // Determine animation speed based on mode
      let increment;
      
      if (useProportionalSpeed) {
        // Calculate speed proportional to activity duration
        // Base animation time from config (in seconds)
        const targetAnimationTime = config.animation.totalAnimationTime;
        
        // Get activity duration in seconds (or default to 30 minutes if not available)
        const activityDuration = activity.durationSeconds || 1800;
        
        // Calculate speed - proportional to duration, capped for very short/long activities
        const durationFactor = Math.min(Math.max(activityDuration / 1800, 0.5), 3); // Limit range to 0.5x-3x
        increment = config.animation.baseSpeed / durationFactor;
      } else {
        // Fixed speed - about 2 seconds per activity regardless of duration
        // Standard animation is ~500 frames at 60fps for 8.3 seconds
        // We want 2 seconds per activity = 120 frames = ~0.0083 increment
        increment = 0.0083;
      }
      
      // Update progress 
      progressRef.current += increment;
      
      // Calculate visible coordinates
      const coordinates = activity.coordinates;
      const pointIndex = Math.floor(progressRef.current * coordinates.length);
      const visibleCoordinates = coordinates.slice(0, pointIndex + 1);
      
      // Update map layers
      if (visibleCoordinates.length > 0) {
        try {
          // Update route
          mapRef.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: visibleCoordinates
            }
          });
          
          // Update current point
          const currentPoint = visibleCoordinates[visibleCoordinates.length - 1];
          mapRef.current.getSource('current-point').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: currentPoint
            }
          });
        } catch (error) {
          console.error('Error updating map data:', error);
        }
      }
      
      // Check if animation is complete
      if (progressRef.current >= 1) {
        // Get completed routes from the layer
        const completedSource = mapRef.current.getSource('completed-routes');
        const completedData = completedSource._data || { type: 'FeatureCollection', features: [] };
        
        // Update ALL features to have finalView: false for normal animation opacity
        const updatedFeatures = completedData.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            finalView: false // Set to low opacity during animation
          }
        }));
        
        // Add the current route to completed routes
        updatedFeatures.push({
          type: 'Feature',
          properties: {
            name: activity.name,
            activityIndex: activityIndexRef.current,
            finalView: false // During animation, use low opacity
          },
          geometry: {
            type: 'LineString',
            coordinates: activity.coordinates
          }
        });
        
        // Update completed routes source
        completedSource.setData({
          type: 'FeatureCollection',
          features: updatedFeatures
        });
        
        // Check if this is the last activity
        if (activityIndexRef.current < activities.length - 1) {
          // Move to next activity directly without zooming out
          activityIndexRef.current++;
          const nextActivity = activities[activityIndexRef.current];
          
          // Clear the active route
          mapRef.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
          
          // Set point to first coordinate of next activity
          if (nextActivity.coordinates.length > 0) {
            mapRef.current.getSource('current-point').setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: nextActivity.coordinates[0]
              }
            });
          }
          
          // Zoom to next activity
          const bounds = new mapboxgl.LngLatBounds(
            [nextActivity.bounds.sw[0], nextActivity.bounds.sw[1]],
            [nextActivity.bounds.ne[0], nextActivity.bounds.ne[1]]
          );
          
          // Zoom with padding for better visibility - extra padding at bottom
          mapRef.current.fitBounds(bounds, {
            padding: {
              top: 100,
              bottom: 150, // Increased bottom padding to avoid routes being cut off
              left: 100,
              right: 100
            },
            duration: config.animation.zoomDuration
          });
          
          // Reset progress immediately
          progressRef.current = 0;
          phaseRef.current = 'waiting';
          
          // Force UI update for new activity with zero progress
          if (onAnimationUpdate) {
            onAnimationUpdate(nextActivity, 0);
          }
          
          setTimeout(() => {
            phaseRef.current = 'animate';
            // Force one more frame with zero progress before animating
            if (onAnimationUpdate) {
              onAnimationUpdate(nextActivity, 0);
            }
            animationRef.current = requestAnimationFrame(animateFrame);
          }, config.animation.zoomDuration);
          
        } else {
          // This is the last activity - zoom out to show all routes
          phaseRef.current = 'final-zoom-out';
          
          // Get completed routes data
          const completedSource = mapRef.current.getSource('completed-routes');
          const completedData = completedSource._data || { type: 'FeatureCollection', features: [] };
          
          // Mark all features for final view with full color
          const finalFeatures = completedData.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              finalView: true // Add this flag for styling
            }
          }));
          
          // Update the source with full-color final view
          completedSource.setData({
            type: 'FeatureCollection',
            features: finalFeatures
          });
          
          // Fit map to all activities
          const bounds = new mapboxgl.LngLatBounds();
          activities.forEach(a => {
            bounds.extend([a.bounds.sw[0], a.bounds.sw[1]]);
            bounds.extend([a.bounds.ne[0], a.bounds.ne[1]]);
          });
          
          mapRef.current.fitBounds(bounds, {
            padding: config.animation.padding,
            duration: config.animation.zoomDuration
          });
          
          // Clear current point
          mapRef.current.getSource('current-point').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: []
            }
          });
          
          // Finish animation after zoom
          setTimeout(() => {
            phaseRef.current = 'complete';
            
            // Make sure all routes are full strength
            const completedSource = mapRef.current.getSource('completed-routes');
            const completedData = completedSource._data || { type: 'FeatureCollection', features: [] };
            
            // Ensure all features have finalView=true for full strength rendering
            const finalFeatures = completedData.features.map(feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                finalView: true
              }
            }));
            
            // Update the source again to ensure all are at full strength
            completedSource.setData({
              type: 'FeatureCollection',
              features: finalFeatures
            });
            
            // Notify completion
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, config.animation.zoomDuration + 100);
        }
      }
    }
    // Phase for final zoom out (only happens once at the end)
    else if (phase === 'final-zoom-out') {
      // This phase is handled by setTimeout in the animate phase
      // Just waiting for the timeout to complete
    }
    
    // Continue animation if in an active phase
    if (isAnimating && 
        phaseRef.current !== 'complete' && 
        phaseRef.current !== 'waiting' &&
        phaseRef.current !== 'final-zoom-out') {
      animationRef.current = requestAnimationFrame(animateFrame);
    }
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="map-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default FixedAnimation;