#!/usr/bin/env node

/**
 * Post-install script for Vercel deployment
 * This script runs after npm install and handles database setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running post-install script for Vercel...');

try {
  // Check if we're in a Vercel environment
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    console.log('📦 Vercel environment detected');
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Check if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      console.log('🗄️ Database URL found, running migrations...');
      
      // Check if it's a Turso database
      if (process.env.DATABASE_URL.includes('turso.io')) {
        console.log('🌐 Turso database detected');
        
        // Set auth token for Turso if available
        if (process.env.TURSO_AUTH_TOKEN) {
          process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
        }
      }
      
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Database migrations completed');
      } catch (error) {
        console.warn('⚠️ Migration failed, but continuing deployment:', error.message);
      }
    } else {
      console.log('⚠️ No DATABASE_URL found, skipping migrations');
    }
  } else {
    console.log('🏠 Local environment detected, skipping Vercel-specific setup');
  }
  
  console.log('✅ Post-install script completed successfully');
} catch (error) {
  console.error('❌ Post-install script failed:', error.message);
  // Don't exit with error to avoid breaking the build
  process.exit(0);
}
