#!/usr/bin/env node

/**
 * Database setup script for multi-tenant inventory system
 * This script helps set up PostgreSQL database and run migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up multi-tenant inventory database...\n');

// Check if PostgreSQL is available
try {
  execSync('psql --version', { stdio: 'pipe' });
  console.log('✅ PostgreSQL is available');
} catch (error) {
  console.log('❌ PostgreSQL is not available. Please install PostgreSQL first.');
  console.log('   Visit: https://www.postgresql.org/download/');
  process.exit(1);
}

// Check if .env file exists and has DATABASE_URL
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Please create one based on .env.example');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('DATABASE_URL')) {
  console.log('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('✅ Environment configuration found');

// Try to run Prisma migration
try {
  console.log('\n📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n🔄 Running database migration...');
  execSync('npx prisma migrate dev --name init_multi_tenant_schema', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update your DATABASE_URL in .env with your PostgreSQL credentials');
  console.log('   2. Run: npm run prisma:seed (if you have seed data)');
  console.log('   3. Start development: npm run dev');
  
} catch (error) {
  console.log('\n⚠️  Migration failed. This is expected if PostgreSQL is not running.');
  console.log('   Please ensure PostgreSQL is running and DATABASE_URL is correct.');
  console.log('   Then run: npx prisma migrate dev --name init_multi_tenant_schema');
}