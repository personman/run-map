# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build

## Code Style
- **React**: Functional components with hooks
- **Imports**: Group React imports first, then libraries, then local modules
- **State Management**: Use React hooks (useState, useRef, useEffect)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Error Handling**: Try/catch with appropriate console logging
- **File Structure**: Component files in src/components/, config files in src/config/
- **Styling**: CSS in separate files, className for styling components
- **Configuration**: Never commit API tokens, use config.local.js (gitignored)

## Best Practices
- Wait for config to load before initializing Mapbox
- Validate all coordinates before using them in maps
- Use refs for animation frames to prevent memory leaks
- Provide fallbacks for missing or invalid configuration
- Clean up animations and map resources on component unmount
- Verify all dependencies are properly imported and available