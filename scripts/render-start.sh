#!/bin/bash

# Run database migrations (in case of schema changes)
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node .output/server/index.mjs