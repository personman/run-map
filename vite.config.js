import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if local config exists
const localConfigPath = path.resolve(__dirname, 'src/config/config.local.js');
const hasLocalConfig = fs.existsSync(localConfigPath);

// Create a fallback if needed
if (!hasLocalConfig) {
  console.warn('\x1b[33m%s\x1b[0m', 
    'No config.local.js found. Creating a temporary one for development.'
  );
  const samplePath = path.resolve(__dirname, 'src/config/config.local.sample.js');
  if (fs.existsSync(samplePath)) {
    const sampleContent = fs.readFileSync(samplePath, 'utf-8');
    fs.writeFileSync(localConfigPath, sampleContent, 'utf-8');
    console.warn('\x1b[33m%s\x1b[0m', 
      'Created a temporary config.local.js from sample. REPLACE THE TOKEN!'
    );
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      // Add any project aliases here
    }
  }
});