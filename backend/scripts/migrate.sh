#!/bin/bash

# TutorConnect Database Migration Script
# Run this after deploying to Render to set up the database

echo "Starting TutorConnect database migration..."

# Set environment
export NODE_ENV=production

# Run the migration
node src/database/migrate.js

echo "Database migration completed successfully!"

# Optional: Run seeder for demo data (uncomment if needed)
# echo "Seeding database with sample data..."
# node src/database/seed.js
# echo "Database seeding completed!"

echo "Database setup complete. Your TutorConnect application is ready!"