// Default configuration - will be overridden by local config
const config = {
  mapbox: {
    // Use the token directly here since we're having issues with dynamic imports
    accessToken: 'pk.eyJ1IjoicGVyc29ubWFuMiIsImEiOiJjbTl2bGk1N2Ewa2czMnBwbXdnNG50aWJ6In0.MaAiXGLd2ll5_aJi4Ln_5A',
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

// Note: Dynamic config loading would typically be done with import(), but
// we've hardcoded the token for now to simplify things
console.log('Using default config with embedded token')

export default config;