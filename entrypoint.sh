#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running Prisma seed..."
npm run seed

echo "Starting application..."
node dist/main
