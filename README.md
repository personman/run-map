# Strava Run Maps Animation

This app animates your Strava activities on a map. Upload your GPX files from Strava, and watch as the app shows each activity with a smooth animation.

## Features

- Uploads multiple GPX files exported from Strava
- Animates each activity one by one in chronological order
- Shows a smooth transition between activities
- Creates a trail effect as each run progresses
- Customizable animation speed modes
- Detailed activity information display

## Setup

1. Clone this repository
2. Install dependencies:

```
npm install
```

3. Configure your Mapbox token:
   - Sign up for an account at [Mapbox](https://account.mapbox.com/)
   - Create a token with the appropriate permissions
   - Copy the sample config to create your local config:
     ```
     cp src/config/config.local.sample.js src/config/config.local.js
     ```
   - Edit `src/config/config.local.js` and replace `YOUR_MAPBOX_TOKEN_HERE` with your actual token
   - IMPORTANT: Never commit your config.local.js file as it contains your private token

4. Configure animation options (optional):
   - In `src/config/config.js`, you can customize animation settings:
     ```javascript
     animation: {
       speed: 0.001,        // Lower values = slower animation
       zoomDuration: 2000,  // Transition time in milliseconds
       padding: 50          // Padding around routes when zoomed in
     }
     ```

5. Start the development server:

```
npm run dev
```

## How to Use

1. Export your GPX files from Strava:
   - Go to your activity on Strava
   - Click the "..." button
   - Select "Export GPX"
   - Save the file

2. Upload your GPX files using the "Upload GPX Files" button

3. Click "Start Animation" to begin

## Building for Production

To create a production build:

```
npm run build
```

The build output will be in the `dist` directory, which you can deploy to any static web hosting service.

## Technologies Used

- React
- Mapbox GL JS
- gpxparser

## Future Strava API Integration

For future development, here are plans to integrate directly with Strava's API:

### Authentication
- Implement OAuth 2.0 flow with Strava
- Register app in Strava developer portal
- Store user tokens securely

### Data Filtering Options
- **Time-based**: Date ranges, relative time periods (last week/month)
- **Location-based**: Geographical area selection
- **Type Filters**: Run, ride, swim, etc.
- **Performance Filters**: Distance, elevation, pace ranges
- **Keyword Search**: Activity title and description filters

### Technical Implementation
- Create serverless functions to handle API requests
- Implement token refresh mechanism
- Fetch GPX data directly from Strava

See [Strava API Documentation](https://developers.strava.com/) for more details.