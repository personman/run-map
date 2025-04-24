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

// In Vite/ES modules we need to use a different approach than require()
// The solution is to directly import the local config at build time

// Import directly for ES modules (Vite will handle this)
import * as localConfigModule from './config.local.js';

// Apply local config if available
if (localConfigModule && localConfigModule.default) {
  console.log('Using local config');
  Object.assign(config, localConfigModule.default);
} else {
  console.warn('No local config found or it has no default export.');
  console.warn('Please create src/config/config.local.js based on config.local.sample.js');
}

// Verify token is not default
if (config.mapbox.accessToken === 'YOUR_MAPBOX_TOKEN_HERE') {
  console.error('⚠️ No Mapbox token configured! Please set your token in config.local.js');
}

export default config;