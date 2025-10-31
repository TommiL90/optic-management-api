#!/usr/bin/env node

/**
 * Development script with Turso
 * This script helps set up a local development environment with Turso
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up development environment with Turso...');

try {
  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    fs.writeFileSync('.env', `# Environment Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
LOG_PRETTY=true

# Database Configuration
DATABASE_URL="file:./dev.db"
`);
  }

  // Check if user wants to use Turso for development
  const useTurso = process.argv.includes('--turso');
  
  if (useTurso) {
    console.log('🌐 Setting up Turso for development...');
    
    // Check if Turso CLI is installed
    try {
      execSync('turso --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Turso CLI...');
      execSync('curl -sSfL https://get.tur.so/install.sh | bash', { stdio: 'inherit' });
    }

    // Check if user is logged in
    try {
      execSync('turso auth whoami', { stdio: 'pipe' });
    } catch (error) {
      console.log('🔐 Please log in to Turso first:');
      console.log('Run: turso auth login');
      process.exit(1);
    }

    // Create development database
    const devDbName = 'optic-management-dev';
    console.log(`🗄️ Creating development database: ${devDbName}`);
    
    try {
      execSync(`turso db create ${devDbName}`, { stdio: 'inherit' });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Development database already exists');
      } else {
        throw error;
      }
    }

    // Get database URL and update .env
    const dbUrl = execSync(`turso db show ${devDbName} --url`, { encoding: 'utf8' }).trim();
    const authToken = execSync('turso auth token', { encoding: 'utf8' }).trim();

    // Update .env file
    const envContent = `# Environment Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
LOG_PRETTY=true

# Turso Database Configuration
DATABASE_URL="${dbUrl}"
TURSO_AUTH_TOKEN="${authToken}"
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ .env updated with Turso configuration');
  }

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run migrations
  console.log('🔄 Running database migrations...');
  execSync('npx prisma migrate dev', { stdio: 'inherit' });

  // Seed database
  console.log('🌱 Seeding database...');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Seeding failed, but continuing...');
  }

  console.log('\n🎉 Development environment ready!');
  console.log('\n📋 Next steps:');
  console.log('1. Run "pnpm start:dev" to start the development server');
  console.log('2. Visit http://localhost:3000/docs for API documentation');
  console.log('3. Visit http://localhost:3000/health for health check');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
