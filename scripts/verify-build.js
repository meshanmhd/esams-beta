#!/usr/bin/env node

/**
 * Build verification script for Netlify
 * This script ensures the build process is working correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting build verification...');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Check if package-lock.json exists
if (!fs.existsSync('package-lock.json')) {
  console.warn('⚠️  package-lock.json not found, this may cause build issues');
}

// Check if .next directory exists and is not empty
if (fs.existsSync('.next')) {
  const nextFiles = fs.readdirSync('.next');
  if (nextFiles.length === 0) {
    console.warn('⚠️  .next directory is empty');
  } else {
    console.log('✅ .next directory exists and contains files');
  }
} else {
  console.warn('⚠️  .next directory not found');
}

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

// Check if required environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
} else {
  console.log('✅ All required environment variables are set');
}

console.log('✅ Build verification completed');
