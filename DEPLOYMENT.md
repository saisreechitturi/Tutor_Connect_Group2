# TutorConnect - Render Deployment Guide

This guide will help you deploy the TutorConnect application to Render with PostgreSQL database.

## Project Structure

```
tutor-connect/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Authentication & validation
│   │   ├── database/      # Database connection & migrations
│   │   └── utils/         # Helper functions
│   ├── package.json
│   └── .env.example
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── context/       # React context
│   ├── public/
│   └── package.json
├── render.yaml           # Render deployment configuration
└── README.md
```

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js**: Version 18.0.0 or higher

## Deployment Steps

### 1. Prepare Your Repository

1. Push your code to GitHub:

```bash
git add .
git commit -m "Restructure for Render deployment"
git push origin main
```

### 2. Deploy to Render

1. **Connect Your Repository**:
   - Go to your Render dashboard
   - Click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing this project

2. **Render will automatically**:
   - Create a PostgreSQL database
   - Deploy the backend service
   - Deploy the frontend service
   - Set up environment variables

### 3. Environment Variables

The following environment variables will be automatically set:

**Backend**:

- `NODE_ENV=production`
- `DATABASE_URL` (automatically from database)
- `JWT_SECRET` (auto-generated)
- `FRONTEND_URL` (automatically from frontend service)

**Frontend**:

- `REACT_APP_API_URL` (automatically from backend service)

### 4. Database Setup

After deployment, initialize your database:

1. Go to your backend service in Render dashboard
2. Open the "Shell" tab
3. Run the migration command:

```bash
npm run db:migrate
```

### 5. Custom Domain (Optional)

1. In your service settings, add your custom domain
2. Update your DNS settings to point to Render
3. SSL certificates are automatically provisioned

## Local Development

### Setup

1. **Install dependencies**:

```bash
# Install root dependencies
npm install

# Setup backend and frontend
npm run setup
```

2. **Environment Variables**:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the .env file with your local settings
```

3. **Database Setup** (Local PostgreSQL):

```bash
# Run migrations
npm run migrate

# (Optional) Seed with sample data
npm run seed
```

### Running the Application

**Development mode** (both frontend and backend):

```bash
npm run dev
```

**Backend only**:

```bash
npm run server
```

**Frontend only**:

```bash
npm run client
```

The application will be available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:5000>

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts (students, tutors, admins)
- `tutor_profiles` - Extended tutor information
- `subjects` - Available subjects
- `sessions` - Tutoring sessions
- `tasks` - Student tasks and assignments
- `messages` - User messaging system
- `calendar_events` - Calendar and scheduling
- `notifications` - System notifications

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/sessions` - Get user sessions
- `GET /api/users/:id/tasks` - Get user tasks

### Tutors

- `GET /api/tutors` - Browse tutors
- `GET /api/tutors/:id` - Get tutor profile
- `GET /api/tutors/:id/students` - Get tutor's students

### Sessions

- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Book a session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Cancel session

### Tasks

- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messages

- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation

### Admin (Admin only)

- `GET /api/admin/users` - Manage users
- `GET /api/admin/stats` - Platform statistics
- `PATCH /api/admin/users/:id/status` - Update user status

## Features

### Completed

✅ **Backend Infrastructure**

- Express.js server with PostgreSQL
- JWT authentication
- RESTful API endpoints
- Database migrations and schema
- Admin panel APIs

✅ **Frontend Migration**

- Moved to separate frontend directory
- Updated API service layer
- Integrated with backend authentication

✅ **Deployment Configuration**

- Render.yaml configuration
- Environment variable setup
- PostgreSQL database connection

### User Roles

**Students**:

- Browse and search tutors
- Book tutoring sessions
- Manage tasks and assignments
- Message tutors
- Track progress

**Tutors**:

- Manage student sessions
- Track earnings and analytics
- Communicate with students
- Set availability and rates

**Admins**:

- User management
- Platform analytics
- Session oversight
- System notifications

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- SQL injection prevention

## Support

For deployment issues or questions:

1. Check Render logs in the dashboard
2. Review environment variables
3. Ensure database is properly initialized
4. Contact the development team

## License

MIT License - see LICENSE file for details.
