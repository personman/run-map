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

// In Vite/ES modules we use dynamic imports
// We use a try/catch approach with import() to handle both development and production

// Function to load local config
const loadLocalConfig = async () => {
  try {
    // Dynamic import for local config
    const localConfig = await import('./config.local.js');
    if (localConfig.default) {
      console.log('Using local config');
      Object.assign(config, localConfig.default);
    }
  } catch (error) {
    console.warn('Error loading local config:', error.message);
    console.warn('Please create src/config/config.local.js based on config.local.sample.js');
  }
};

// Load local config immediately (this is an async operation but config will be used after page load)
loadLocalConfig();

// Verify token is not default
if (config.mapbox.accessToken === 'YOUR_MAPBOX_TOKEN_HERE') {
  console.error('⚠️ No Mapbox token configured! Please set your token in config.local.js');
}

export default config;