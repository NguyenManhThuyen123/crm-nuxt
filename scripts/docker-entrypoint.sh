#!/bin/sh

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Database URL configured"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Run Prisma seed to create initial data
echo "Running Prisma seed..."
npx prisma db seed

# Start the application
echo "Starting application..."
exec node .output/server/index.mjs