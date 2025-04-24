// Default configuration - will be overridden by local config
const config = {
  mapbox: {
    // This should be replaced with your actual token in config.local.js
    accessToken: 'YOUR_MAPBOX_TOKEN_HERE',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    defaultCenter: [-74.5, 40],
    defaultZoom: 2
  },
  animation: {
    baseSpeed: 0.002, // Base speed factor
    totalAnimationTime: 30, // Target animation time in seconds for a typical activity
    zoomDuration: 2000, // milliseconds
    padding: 50
  }
};

// For production: would use dynamic import - using static for now
try {
  // Try to load local config (this file is not included in the git repo)
  const localConfigModule = require('./config.local.js');
  if (localConfigModule.default) {
    console.log('Using local config');
    Object.assign(config, localConfigModule.default);
  }
} catch (error) {
  console.warn('No local config found. Using default config.');
  console.warn('Please create src/config/config.local.js based on config.local.sample.js');
}

// Verify token is not default
if (config.mapbox.accessToken === 'YOUR_MAPBOX_TOKEN_HERE') {
  console.error('⚠️ No Mapbox token configured! Please set your token in config.local.js');
}

export default config;