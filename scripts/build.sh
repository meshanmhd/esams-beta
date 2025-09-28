#!/bin/bash

# Netlify build script with error handling
set -e

echo "🔍 Starting Netlify build process..."

# Set CI to false to prevent warnings from being treated as errors
export CI=false

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
