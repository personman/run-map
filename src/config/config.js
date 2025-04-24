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

// Create a promise that can be used to track when config loading is complete
let configLoadedResolve;
const configLoadedPromise = new Promise(resolve => {
  configLoadedResolve = resolve;
});

// Function to load local config
const loadLocalConfig = async () => {
  try {
    // Dynamic import for local config
    const localConfig = await import('./config.local.js');
    if (localConfig.default) {
      console.log('Using local config');
      
      // Deep copy the config to avoid reference issues
      const mergedConfig = {
        ...config,
        mapbox: {
          ...config.mapbox,
          ...(localConfig.default.mapbox || {})
        },
        animation: {
          ...config.animation,
          ...(localConfig.default.animation || {})
        }
      };
      
      // Validate the config values
      if (mergedConfig.mapbox.accessToken === 'YOUR_MAPBOX_TOKEN_HERE') {
        console.error('⚠️ No Mapbox token configured! Please set your token in config.local.js');
        configLoadedResolve(false);
      } else if (!Array.isArray(mergedConfig.mapbox.defaultCenter) || 
                mergedConfig.mapbox.defaultCenter.length !== 2 ||
                isNaN(mergedConfig.mapbox.defaultCenter[0]) ||
                isNaN(mergedConfig.mapbox.defaultCenter[1])) {
        console.error('⚠️ Invalid center coordinates in config! Using default.');
        // Fix the coordinates
        mergedConfig.mapbox.defaultCenter = [-74.0060, 40.7128]; // NYC coordinates as fallback
        // Update the config and resolve
        Object.assign(config, mergedConfig);
        configLoadedResolve(true);
      } else {
        // Update the config and resolve
        Object.assign(config, mergedConfig);
        configLoadedResolve(true);
      }
    } else {
      configLoadedResolve(false);
    }
  } catch (error) {
    console.warn('Error loading local config:', error.message);
    console.warn('Please create src/config/config.local.js based on config.local.sample.js');
    console.error('⚠️ No Mapbox token configured! Please set your token in config.local.js');
    configLoadedResolve(false);
  }
};

// Load local config immediately
loadLocalConfig();

// Utility function to check if configuration is properly loaded
const isConfigReady = async () => {
  const result = await configLoadedPromise;
  return result && config.mapbox.accessToken !== 'YOUR_MAPBOX_TOKEN_HERE';
};

export { isConfigReady };
export default config;