-- UTA Cloud Database Setup Script
-- Run this script on your UTA PostgreSQL instance to set up the Tutor Connect database

-- Connect to PostgreSQL and create the database
-- (Run as postgres superuser)

-- Create database
CREATE DATABASE tutorconnect;

-- Create user (replace 'your_password' with a secure password)
CREATE USER tutorconnect_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tutorconnect TO tutorconnect_user;

-- Connect to the tutorconnect database to create tables
\c tutorconnect;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO tutorconnect_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tutorconnect_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tutorconnect_user;

-- Now run the main schema creation script
-- \i /path/to/your/database-schema.sql

-- Or copy and paste the schema from backend/docs/database-schema.sql

-- Enable uuid extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can also run the Node.js migration script after this:
-- cd backend && npm run migrate