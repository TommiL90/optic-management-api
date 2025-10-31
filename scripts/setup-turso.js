#!/usr/bin/env node

/**
 * Setup script for Turso database
 * This script helps configure Turso for the project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Turso database...');

try {
  // Check if Turso CLI is installed
  try {
    execSync('turso --version', { stdio: 'pipe' });
    console.log('✅ Turso CLI is installed');
  } catch (error) {
    console.log('📦 Installing Turso CLI...');
    execSync('curl -sSfL https://get.tur.so/install.sh | bash', { stdio: 'inherit' });
    console.log('✅ Turso CLI installed successfully');
  }

  // Check if user is logged in
  try {
    execSync('turso auth whoami', { stdio: 'pipe' });
    console.log('✅ Already logged in to Turso');
  } catch (error) {
    console.log('🔐 Please log in to Turso:');
    console.log('Run: turso auth login');
    console.log('Then run this script again.');
    process.exit(1);
  }

  // Create database
  const dbName = 'optic-management';
  console.log(`🗄️ Creating database: ${dbName}`);
  
  try {
    execSync(`turso db create ${dbName}`, { stdio: 'inherit' });
    console.log('✅ Database created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Database already exists');
    } else {
      throw error;
    }
  }

  // Get database URL
  console.log('🔗 Getting database URL...');
  const dbUrl = execSync(`turso db show ${dbName} --url`, { encoding: 'utf8' }).trim();
  
  // Get auth token
  console.log('🔑 Getting auth token...');
  const authToken = execSync('turso auth token', { encoding: 'utf8' }).trim();

  // Create .env file with Turso configuration
  const envContent = `# Environment Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
LOG_PRETTY=false

# Turso Database Configuration
DATABASE_URL="${dbUrl}"
TURSO_AUTH_TOKEN="${authToken}"
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created with Turso configuration');

  // Run migrations
  console.log('🔄 Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations completed');

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  console.log('\n🎉 Turso setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Your database is ready at:', dbUrl);
  console.log('2. Run "npm run start:dev" to start the development server');
  console.log('3. For production, add these environment variables to Vercel:');
  console.log(`   DATABASE_URL=${dbUrl}`);
  console.log(`   TURSO_AUTH_TOKEN=${authToken}`);

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
