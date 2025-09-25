# 🎓 TutorConnect - Local Development Setup Guide

**TutorConnect** is a comprehensive tutoring platform built with Node.js/Express backend, React frontend, and PostgreSQL database. This guide will walk you through setting up the complete development environment on your local machine.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Architecture](#project-architecture)
- [Installation Steps](#installation-steps)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Sample Data](#sample-data)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before setting up TutorConnect, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v16.0.0 or later) - [Download](https://nodejs.org/)
- **npm** (v8.0.0 or later) - Comes with Node.js
- **PostgreSQL** (v13.0 or later) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **pgAdmin** (Optional but recommended) - [Download](https://www.pgadmin.org/download/)

### Verify Installation

```bash
node --version        # Should show v16.0.0 or later
npm --version         # Should show v8.0.0 or later
psql --version        # Should show PostgreSQL version
git --version         # Should show Git version
```

## 🏗️ Project Architecture

```
TutorConnect/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── database/          # Database configuration and scripts
│   │   │   ├── connection.js  # Database connection
│   │   │   ├── schema.sql     # Database schema
│   │   │   ├── setup.js       # Schema setup script
│   │   │   ├── seed.js        # Sample data insertion
│   │   │   ├── migrate.js     # Migration utilities
│   │   │   └── check-data.js  # Data verification
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js        # Authentication middleware
│   │   │   └── errorHandler.js # Error handling
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.js       # Authentication routes
│   │   │   ├── users.js      # User management
│   │   │   ├── tutors.js     # Tutor operations
│   │   │   ├── sessions.js   # Session management
│   │   │   └── admin.js      # Admin operations
│   │   ├── utils/            # Utility functions
│   │   │   └── logger.js     # Winston logging
│   │   └── server.js         # Main server file
│   ├── .env.local            # Local environment variables
│   └── package.json          # Backend dependencies
├── frontend/                   # React application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   ├── routes/          # Route configurations
│   │   ├── utils/           # Utility functions
│   │   └── data/           # Mock data (for development)
│   └── package.json         # Frontend dependencies
├── build/                     # Production build files
├── docs/                      # Database documentation
│   ├── database-diagram.dbml # Database schema diagram
│   ├── database-schema.sql   # SQL schema
│   └── firestore-schema.md   # Schema documentation
└── README.md                 # Main project documentation
```

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/Abhinaykotla/Tutor_Connect_Group2.git
cd Tutor_Connect_Group2
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

**Backend Dependencies Installed:**

- `express` - Web framework for Node.js
- `pg` - PostgreSQL client for Node.js
- `bcryptjs` - Password hashing library
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables loader
- `winston` - Professional logging library
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware
- `compression` - Response compression
- `nodemon` - Development server with auto-restart

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Frontend Dependencies Installed:**

- `react` - UI library (v18)
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Beautiful icon library
- `@tailwindcss/forms` - Form styling plugin
- `postcss` - CSS post-processor
- `autoprefixer` - CSS vendor prefixer

### Step 4: Set Up Environment Variables

Create backend environment file:

```bash
cd ../backend
```

Create `.env.local` file with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=TutorConnect
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex-at-least-64-characters

# Logging Configuration
LOG_LEVEL=debug

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_SECRET=another-secret-key-for-sessions
```

**⚠️ Important Security Notes:**

- Replace `your_postgres_password_here` with your actual PostgreSQL password
- Use a strong, unique JWT secret (at least 64 characters)
- Never commit `.env.local` to version control
- Use different secrets for production

## 🗃️ Database Setup

### Step 1: Create Database

Open PostgreSQL command line (psql) or pgAdmin and create the database:

**Using psql:**

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE TutorConnect;

-- Verify creation
\l
```

**Using pgAdmin:**

1. Right-click on "Databases"
2. Select "Create" → "Database"
3. Enter "TutorConnect" as database name
4. Click "Save"

### Step 2: Run Database Setup Scripts

From the `backend` directory, run the following commands:

```bash
# Create all database tables and schema
npm run db:setup

# Insert sample data (users, subjects, tutors, students)
npm run db:seed

# Or run both commands in sequence
npm run db:full-setup
```

### Step 3: Verify Database Setup

```bash
# Check database contents and verify data
node src/database/check-data.js
```

You should see output showing:

- 6 users (1 admin, 3 tutors, 2 students)
- 10 subjects (Math, Physics, Chemistry, etc.)
- 4 tutor-subject relationships
- All table counts

### Available Database Commands

```bash
npm run db:setup      # Create database schema (tables, indexes, triggers)
npm run db:seed       # Insert sample data
npm run db:full-setup # Complete setup (schema + data)
npm run db:reset      # Reset database (drop all tables and recreate)
npm run db:migrate    # Run database migrations
```

### Database Schema Overview

The application uses PostgreSQL with 12 main tables:

- **users** - User accounts (students, tutors, admin)
- **tutor_profiles** - Extended tutor information (rates, experience)
- **student_profiles** - Extended student information (grade, school)
- **subjects** - Available subjects for tutoring
- **tutor_subjects** - Many-to-many tutor-subject relationships
- **tutoring_sessions** - Scheduled tutoring sessions
- **messages** - In-app messaging system
- **payments** - Payment processing records
- **session_reviews** - Session ratings and reviews
- **notifications** - User notifications
- **user_addresses** - User address information
- **user_preferences** - User settings and preferences

## 🏃 Running the Application

### Development Mode (Recommended)

You can run both servers simultaneously or separately:

#### Option 1: Run Both Servers Together

```bash
# From the root directory
npm run dev
```

This command will start both backend and frontend servers concurrently.

#### Option 2: Run Servers Separately

**Terminal 1: Start Backend Server**

```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
# API endpoints available at http://localhost:5000/api
```

**Terminal 2: Start Frontend Server**

```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
# Automatically opens in your default browser
```

### Production Mode

```bash
# Build frontend for production
cd frontend
npm run build

# Start backend in production mode
cd ../backend
npm start
```

### Server Status Verification

Once both servers are running, you should see:

- **Backend**: Console shows "Server running on port 5000" and database connection success
- **Frontend**: Browser automatically opens to <http://localhost:3000>
- **Database**: Connection logs show successful PostgreSQL connection

## 🌐 Application URLs

- **Frontend (React)**: <http://localhost:3000/Tutor_Connect_Group2>
- **Backend API**: <http://localhost:5000/api>
- **Health Check**: <http://localhost:5000/health>
- **API Status**: <http://localhost:5000/api/status>

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get current user profile

### User Management (`/api/users`)

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user by ID

### Tutor Operations (`/api/tutors`)

- `GET /api/tutors` - Get all active tutors
- `GET /api/tutors/:id` - Get specific tutor by ID
- `GET /api/tutors/search` - Search tutors with filters
- `GET /api/tutors/:id/subjects` - Get tutor's subjects
- `GET /api/tutors/:id/reviews` - Get tutor's reviews

### Session Management (`/api/sessions`)

- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions` - Create new tutoring session
- `GET /api/sessions/:id` - Get specific session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete/cancel session

### Task Management (`/api/tasks`)

- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messaging (`/api/messages`)

- `GET /api/messages` - Get user's messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id/read` - Mark message as read

### Admin Operations (`/api/admin`) - Admin only

- `GET /api/admin/users` - Get all users
- `GET /api/admin/sessions` - Get all sessions
- `PUT /api/admin/users/:id` - Update any user
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/analytics` - Get platform analytics

## 📊 Sample Data

After running `npm run db:seed`, your database will be populated with:

### 👤 Users (6 total)

**Admin Account:**

- **Email**: `admin@tutorconnect.com`
- **Password**: `password123`
- **Role**: Admin
- **Access**: Full platform administration

**Tutors (3):**

1. **Sarah Johnson** - Mathematics Specialist
   - **Email**: `sarah.math@tutorconnect.com`
   - **Password**: `password123`
   - **Subjects**: Mathematics (Advanced level)
   - **Rate**: $35/hour
   - **Experience**: 5 years
   - **Education**: Masters in Mathematics

2. **David Chen** - STEM Expert
   - **Email**: `david.physics@tutorconnect.com`
   - **Password**: `password123`
   - **Subjects**: Mathematics (Advanced), Physics (Advanced)
   - **Rate**: $40/hour
   - **Experience**: 8 years
   - **Education**: PhD in Physics

3. **Maria Rodriguez** - Language Tutor
   - **Email**: `maria.spanish@tutorconnect.com`
   - **Password**: `password123`
   - **Subjects**: Spanish (Advanced level)
   - **Rate**: $30/hour
   - **Experience**: 6 years
   - **Education**: Masters in Spanish Literature

**Students (2):**

1. **John Smith** - High School Student
   - **Email**: `john.student@example.com`
   - **Password**: `password123`
   - **Grade**: 11th Grade
   - **School**: Central High School

2. **Emma Wilson** - College Student
   - **Email**: `emma.student@example.com`
   - **Password**: `password123`
   - **Grade**: College Freshman
   - **School**: State University

### 📚 Subjects (10 total)

**STEM Subjects:**

- Mathematics
- Physics  
- Chemistry
- Biology
- Computer Science

**Language Arts:**

- Spanish
- French
- English Literature

**Social Studies:**

- History
- Economics

### 🎯 Tutor Specializations (4 relationships)

- Sarah Johnson → Mathematics (Advanced)
- David Chen → Mathematics (Advanced)
- David Chen → Physics (Advanced)
- Maria Rodriguez → Spanish (Advanced)

## 🚀 Deployment Options

### GitHub Pages (Frontend Only)

The frontend can be deployed to GitHub Pages:

```bash
cd frontend
npm run deploy
```

**Access URL**: `https://Abhinaykotla.github.io/Tutor_Connect_Group2`

### UTA Cloud Deployment (Full Stack)

The project includes UTA-specific deployment scripts:

```bash
# Backend deployment
cd backend
npm run deploy:uta

# Frontend deployment
cd frontend  
npm run build:uta
```

### Docker Deployment (Optional)

Create `docker-compose.yml` for containerized deployment:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: TutorConnect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
      
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### ❌ Database Connection Issues

**Problem**: `ECONNREFUSED` or `password authentication failed`

**Solutions:**

1. **Verify PostgreSQL is running:**

   ```bash
   # Windows
   net start postgresql-x64-17
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo service postgresql start
   ```

2. **Check database credentials:**
   - Verify `.env.local` has correct password
   - Ensure database name is exactly `TutorConnect`
   - Test connection: `psql -U postgres -d TutorConnect`

3. **Reset database:**

   ```bash
   npm run db:reset
   npm run db:full-setup
   ```

#### ❌ Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000` or `:::5000`

**Solutions:**

1. **Kill processes using the ports:**

   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5000 | xargs kill -9
   ```

2. **Use different ports:**
   - Change `PORT=5001` in `.env.local`
   - Update frontend proxy in `package.json`

#### ❌ npm Install Failures

**Problem**: Package installation fails or dependency conflicts

**Solutions:**

1. **Clear npm cache:**

   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use legacy peer deps for React 18:**

   ```bash
   npm install --legacy-peer-deps
   ```

#### ❌ Environment Variables Not Loading

**Problem**: Database connection fails, JWT errors

**Solutions:**

1. **Verify `.env.local` location:**
   - Must be in `backend/` directory
   - Not in root or frontend directory
   - Check filename (not `.env.local.txt`)

2. **Restart server after changes:**
   - Stop server with Ctrl+C
   - Restart with `npm run dev`

3. **Check variable syntax:**

   ```env
   # Correct
   DB_PASSWORD=mypassword
   
   # Incorrect
   DB_PASSWORD = mypassword
   ```

#### ❌ Database Schema Errors

**Problem**: Table doesn't exist, column not found

**Solutions:**

1. **Verify schema creation:**

   ```bash
   npm run db:setup
   ```

2. **Check table structure:**

   ```bash
   node src/database/check-data.js
   ```

3. **Reset and recreate:**

   ```bash
   npm run db:reset
   npm run db:full-setup
   ```

#### ❌ Frontend API Connection Issues

**Problem**: Network errors, CORS issues

**Solutions:**

1. **Verify backend is running:**
   - Check <http://localhost:5000/health>
   - Look for "Server running" in backend console

2. **Check CORS configuration:**
   - Verify `FRONTEND_URL` in `.env.local`
   - Ensure CORS middleware is enabled

3. **Update API base URL:**

   ```javascript
   // In frontend code
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

#### ❌ JWT Authentication Errors

**Problem**: Token invalid, authentication failures

**Solutions:**

1. **Clear browser storage:**
   - Open browser DevTools
   - Go to Application → Storage
   - Clear Local Storage and Session Storage

2. **Verify JWT secret:**
   - Ensure `JWT_SECRET` is set in `.env.local`
   - Use a strong secret (64+ characters)

3. **Check token expiration:**
   - Default expiration is 24 hours
   - Login again to get new token

### 🆘 Getting Additional Help

If you encounter issues not covered above:

1. **Check server logs:**
   - Backend: Look at terminal output for error messages
   - Frontend: Check browser DevTools Console

2. **Verify system requirements:**
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - PostgreSQL version: `psql --version`

3. **Database connection test:**

   ```bash
   node src/database/check-data.js
   ```

4. **API endpoint test:**

   ```bash
   curl http://localhost:5000/health
   ```

5. **Contact support:**
   - Open an issue in the GitHub repository
   - Include error messages and system information
   - Describe steps to reproduce the problem

## 📈 Development Workflow

### Making Changes

1. **Database Schema Changes:**

   ```bash
   # 1. Modify src/database/schema.sql
   # 2. Reset and recreate database
   npm run db:reset
   npm run db:full-setup
   ```

2. **API Changes:**

   ```bash
   # Server auto-restarts with nodemon
   # Just save your changes in src/routes/
   ```

3. **Frontend Changes:**

   ```bash
   # React hot-reloads automatically
   # Just save your changes in src/
   ```

### Testing Your Setup

1. **Backend Health Check:**
   - Visit <http://localhost:5000/health>
   - Should return: `{"status": "OK", "timestamp": "..."}`

2. **Database Verification:**

   ```bash
   node src/database/check-data.js
   ```

3. **Frontend Access:**
   - Visit <http://localhost:3000/Tutor_Connect_Group2>
   - Should show the TutorConnect homepage

4. **Authentication Test:**
   - Try logging in with `admin@tutorconnect.com` / `password123`
   - Should redirect to appropriate dashboard

### Performance Tips

1. **Database Performance:**
   - Keep connection pool size reasonable (default: 10)
   - Use indexes for frequently queried columns
   - Monitor query execution time in logs

2. **Frontend Performance:**
   - Use React DevTools to monitor component renders
   - Implement code splitting for large components
   - Optimize images and assets

3. **Development Speed:**
   - Use `npm run dev` to start both servers together
   - Keep PostgreSQL running to avoid connection delays
   - Use browser DevTools Network tab to monitor API calls

## 📁 Key Files Reference

### Backend Configuration

- **`src/server.js`** - Main server entry point
- **`src/database/connection.js`** - Database connection setup
- **`src/database/schema.sql`** - Complete database schema
- **`src/routes/`** - API endpoint definitions
- **`.env.local`** - Environment configuration

### Frontend Configuration  

- **`src/App.js`** - Main React application component
- **`src/context/AuthContext.js`** - Authentication state management
- **`src/pages/`** - Page components
- **`package.json`** - Dependencies and scripts

### Database Management

- **`schema.sql`** - Database table definitions
- **`setup.js`** - Schema creation script
- **`seed.js`** - Sample data insertion
- **`migrate.js`** - Database migration utilities
- **`check-data.js`** - Data verification tool

## 🎯 Quick Reference Commands

### Database Operations

```bash
npm run db:full-setup  # Complete database setup
npm run db:reset       # Reset database
node src/database/check-data.js  # Verify data
```

### Development Servers

```bash
npm run dev           # Start both servers (from root)
cd backend && npm run dev    # Backend only
cd frontend && npm start     # Frontend only
```

### Production Build

```bash
cd frontend && npm run build  # Build for production
cd backend && npm start       # Production server
```

---

## 🎉 Success

If you've followed this guide, you now have:

- ✅ PostgreSQL database with 12 tables and sample data
- ✅ Node.js/Express backend API running on port 5000
- ✅ React frontend running on port 3000
- ✅ Full authentication system with sample users
- ✅ Complete tutoring platform ready for development

**Next Steps:**

1. Open <http://localhost:3000/Tutor_Connect_Group2> in your browser
2. Try logging in with sample accounts
3. Explore the tutor search and booking features
4. Start building your own features!

**Happy coding! 🚀**

---

*For production deployment guides, see the main [README.md](README.md) file.*
*For database schema details, check the [docs/](docs/) folder.*
