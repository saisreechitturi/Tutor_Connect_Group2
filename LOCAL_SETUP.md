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
- [1. **Verify database setup:**

   ```bash
   # Check if database exists and has tables
   psql -U postgres -d TutorConnect -c "\dt"
   ```

2. **Check table structure:**

   ```bash
   # Verify table structure and data count
   psql -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM users;"
   psql -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM subjects;"
   ```

3. **Reset database using PostgreSQL commands:**ng](#troubleshooting)

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
│   │   ├── database/          # Database configuration and setup
│   │   │   ├── connection.js  # Database connection
│   │   │   ├── database_structure_only.sql  # Empty database schema
│   │   │   └── TutorConnect_DB.sql          # Complete backup with sample data
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
├── DATABASE_SETUP_GUIDE.md   # Comprehensive database setup guide
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
DB_PASSWORD=Admin

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

- Default PostgreSQL password is set to `Admin` (change if needed)
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

**Using Command Line (Windows):**

```bash
# Create database using createdb utility
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres TutorConnect
```

### Step 2: Set Up Database

You have **two options** for setting up the database:

#### **Option A: Use Complete Database Backup (Recommended)**

This option restores a complete database with schema and sample data:

```bash
# Create empty database first
createdb -U postgres TutorConnect

# Restore from complete backup with sample data
psql -U postgres -d TutorConnect -f backend/src/database/TutorConnect_DB.sql

# Or using full path to psql if not in PATH
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -f backend/src/database/TutorConnect_DB.sql
```

#### **Option B: Use Structure-Only Setup (Clean Start)**

This option creates empty tables without any sample data:

```bash
# Create empty database first
createdb -U postgres TutorConnect

# Create tables only (no data)
psql -U postgres -d TutorConnect -f backend/src/database/database_structure_only.sql

# Or using full path to psql if not in PATH
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -f backend/src/database/database_structure_only.sql
```

📖 **For detailed setup instructions, see [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)**

### Step 3: Verify Database Setup

Check if your database was set up correctly:

```bash
# Check if tables exist
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -c "\dt"

# If you used Option A (complete backup), check user count
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM users;"

# If you used Option B (structure only), tables should exist but be empty
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

#### **Expected Results:**

- **Option A (Complete Backup)**: 14 users, full sample data across all tables
- **Option B (Structure Only)**: Empty tables ready for your data

#### **Understanding the Database Options:**

- **Complete Backup (`TutorConnect_DB.sql`)** - Contains both structure AND sample data with 14 demo accounts
- **Structure Only (`database_structure_only.sql`)** - Contains only table definitions, no data
- **Database Connection** - Configured in `connection.js` for your application

#### **When to Use Each Option:**

- **Use complete backup** for quick setup with demo data to explore features
- **Use structure-only** for production deployment or when you want to add your own data
- **Refer to DATABASE_SETUP_GUIDE.md** for comprehensive setup instructions and troubleshooting

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

When using the complete database backup (`TutorConnect_DB.sql`), your database includes **14 demo accounts** with the password `demo`:

### 👤 Demo Accounts (14 total)

**Admin Accounts (3):**

- `admin@demo.com` | Password: `demo` | Full platform management
- `admin@tutorconnect.com` | Password: `demo` | System administrator  
- `ef910e0b-1654-489e-b3f4-d647a22bff84` | Admin User | Full access

**Student Accounts (7):**

- `student@demo.com` | Password: `demo` | Basic student access
- `alex.student@tutorconnect.com` | Password: `demo` | Alex Thompson (High school senior)
- `taylor.study@tutorconnect.com` | Password: `demo` | Taylor Brown (Middle school)
- `jamie.learner@tutorconnect.com` | Password: `demo` | Jamie Wilson (College sophomore)
- `john.student@example.com` | Password: `demo` | John Smith (High school)
- `emma.student@example.com` | Password: `demo` | Emma Wilson (College freshman)

**Tutor Accounts (4):**

- `tutor@demo.com` | Password: `demo` | Basic tutor access
- `sarah.math@tutorconnect.com` | Password: `demo` | Sarah Johnson (Math, 5+ years)
- `mike.science@tutorconnect.com` | Password: `demo` | Michael Chen (Physics PhD)
- `david.cs@tutorconnect.com` | Password: `demo` | David Kim (Computer Science)
- `emma.language@tutorconnect.com` | Password: `demo` | Emma Rodriguez (Bilingual educator)
- `maria.spanish@tutorconnect.com` | Password: `demo` | Maria Rodriguez (Spanish)
- `david.physics@tutorconnect.com` | Password: `demo` | David Chen (Physics PhD)

### 📚 Complete Data Includes

**Database Contents:**

- **14 Users** with profiles, contact info, and role-based access
- **Subjects** covering STEM, languages, and liberal arts
- **Tutor Profiles** with rates, experience, and specializations
- **Student Profiles** with grade levels and learning goals
- **Session Data** including scheduled and completed sessions
- **Task Management** data for assignment tracking
- **Settings** and system configuration

**Ready-to-Use Features:**

- User authentication and role-based dashboards
- Tutor-student matching and session booking
- Task and assignment management
- Administrative controls and analytics
- Real-time messaging system data

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

3. **Reset database using PostgreSQL commands:**

   ```bash
   # Drop and recreate database
   psql -U postgres -c "DROP DATABASE IF EXISTS TutorConnect;"
   psql -U postgres -c "CREATE DATABASE TutorConnect;"
   
   # Restore from backup
   psql -U postgres -d TutorConnect -f backend/src/database/TutorConnect_DB.sql
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
   # Test PostgreSQL connection and check data
   psql -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM users;"
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
   # 1. Modify backend/src/database/database_structure_only.sql or TutorConnect_DB.sql
   # 2. Drop and recreate database with new schema
   psql -U postgres -c "DROP DATABASE IF EXISTS TutorConnect;"
   psql -U postgres -c "CREATE DATABASE TutorConnect;"
   psql -U postgres -d TutorConnect -f backend/src/database/TutorConnect_DB.sql
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

- **`connection.js`** - Database connection configuration
- **`database_structure_only.sql`** - Empty database schema
- **`TutorConnect_DB.sql`** - Complete backup with sample data

## 🎯 Quick Reference Commands

### Database Operations

```bash
# Set up database with sample data
psql -U postgres -d TutorConnect -f backend/src/database/TutorConnect_DB.sql

# Set up empty database structure
psql -U postgres -d TutorConnect -f backend/src/database/database_structure_only.sql

# Check database status
psql -U postgres -d TutorConnect -c "\dt"  # List tables
psql -U postgres -d TutorConnect -c "SELECT COUNT(*) FROM users;"  # Check data
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

- ✅ PostgreSQL database with complete schema and demo data (14 accounts)
- ✅ Node.js/Express backend API running on port 5000
- ✅ React frontend running on port 3000
- ✅ Full authentication system with demo users (password: demo)
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
