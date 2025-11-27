# GitHub Copilot Instructions for TutorConnect

## Project Overview

TutorConnect is a comprehensive full-stack tutoring platform that connects students with expert tutors. The application features AI-powered study assistance, task management, real-time communication, and role-based access control.

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS 3.3
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: React Scripts (Create React App)

### Backend
- **Runtime**: Node.js >= 18.0.0
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Testing**: Jest, Supertest

### Deployment
- Frontend: GitHub Pages
- Backend: Render with PostgreSQL database
- Configuration: render.yaml blueprint

## Project Structure

```
tutor-connect/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API endpoint definitions
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── database/    # Schema, migrations, SQL files
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Helper functions
│   │   └── server.js    # Entry point
│   └── package.json
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   ├── routes/      # Route configurations
│   │   ├── services/    # API integration
│   │   ├── context/     # State management
│   │   └── App.js       # Root component
│   └── package.json
├── deployment/          # Deployment scripts and configs
└── package.json         # Root package for concurrency
```

## Development Guidelines

### Code Style and Conventions

1. **JavaScript/React**:
   - Use functional components with hooks
   - Prefer arrow functions for component definitions
   - Use descriptive variable and function names
   - Keep components focused and single-purpose
   - Extract reusable logic into custom hooks

2. **CSS/Styling**:
   - Use Tailwind CSS utility classes
   - Follow the existing color scheme:
     - Primary: Blue shades (#3b82f6, #2563eb, #1d4ed8)
     - Secondary: Gray shades for neutral elements
     - Status colors: Green (success), Yellow (warning), Red (error)
   - Ensure responsive design (mobile-first approach)
   - Maintain accessibility (WCAG compliance)

3. **API Design**:
   - RESTful endpoint naming conventions
   - Use proper HTTP methods (GET, POST, PUT, DELETE)
   - Include input validation using express-validator
   - Return consistent error responses
   - Use rate limiting for API protection

4. **Database**:
   - Use parameterized queries to prevent SQL injection
   - Follow the existing schema in `backend/src/database/`
   - Include migrations for schema changes
   - Document any new tables or significant changes

### Authentication and Security

- JWT tokens for authentication (stored in localStorage on frontend)
- Role-based access control (Admin, Student, Tutor)
- Password hashing with bcrypt (10 rounds minimum)
- Helmet middleware for security headers
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration for frontend-backend communication

### State Management

- React Context API for global state (AuthContext)
- Local state for component-specific data
- Services layer for API calls (`frontend/src/services/`)
- Mock data available for development

### Error Handling

- Backend: Centralized error handling middleware
- Frontend: Try-catch blocks with user-friendly error messages
- Log errors with Winston on backend
- Display error states in UI components

## Common Development Tasks

### Adding a New Feature

1. **Frontend Component**:
   ```javascript
   // Create in frontend/src/components/ or frontend/src/pages/
   import React, { useState, useEffect } from 'react';
   
   const MyComponent = () => {
     // Component logic
     return (/* JSX */);
   };
   
   export default MyComponent;
   ```

2. **Backend API Endpoint**:
   ```javascript
   // Create in backend/src/routes/
   const express = require('express');
   const router = express.Router();
   const { authenticate, authorize } = require('../middleware/auth');
   
   router.get('/endpoint', authenticate, async (req, res) => {
     try {
       // Implementation
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   });
   
   module.exports = router;
   ```

3. **Database Query**:
   ```javascript
   const { Pool } = require('pg');
   const result = await pool.query(
     'SELECT * FROM table_name WHERE id = $1',
     [id]
   );
   ```

### Testing

- Write unit tests for services and utilities
- Use Jest for backend testing
- Use React Testing Library for frontend components
- Include integration tests for API endpoints
- Test files should be co-located with implementation: `*.test.js`

### Running the Application

```bash
# Development (both frontend and backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Setup dependencies
npm run setup
```

## Role-Specific Features

### Student Features
- Browse and search tutors
- Book tutoring sessions
- Task/study planner
- AI chatbot for study help
- Session history and feedback
- Calendar integration

### Tutor Features
- Profile management with subjects/rates
- Session management
- Availability scheduling
- Student feedback viewing
- Earnings tracking

### Admin Features
- User management (CRUD)
- Platform analytics
- Session monitoring
- Content moderation
- System configuration

## AI Integration

The platform includes an AI chatbot (floating widget):
- Q&A assistance for students
- Study tips and guidance
- Platform navigation help
- Future: AI-generated study plans and tutor matching

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Semantic HTML elements
- ARIA labels and roles where appropriate
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (minimum 4.5:1)
- Focus indicators on interactive elements

## Deployment Process

### Frontend (GitHub Pages)
```bash
npm run deploy
```

### Backend (Render)
- Push to GitHub triggers automatic deployment
- Uses render.yaml configuration
- PostgreSQL database auto-provisioned
- Environment variables configured in Render dashboard

## Demo Accounts

For testing purposes, demo accounts are available:
- Admin: `admin@demo.com` / `demo123`
- Student: `student@demo.com` / `demo123`
- Tutor: `tutor@demo.com` / `demo123`

## Important Notes

1. **Environment Variables**: Never commit sensitive credentials
2. **Database**: Use the sample data in `backend/src/database/TutorConnect_DB.sql` for local testing
3. **Routing**: Frontend uses HashRouter for GitHub Pages compatibility
4. **CORS**: Configure backend CORS to allow frontend origin
5. **Rate Limiting**: Apply to authentication and sensitive endpoints
6. **Validation**: Always validate and sanitize user input on both frontend and backend

## Current Development Phase

- Phase 1: Planning & Proposal ✅
- Phase 2: Frontend Development 🚧 (Current)
- Phase 3: Backend Development (Planned)
- Phase 4: Advanced Features (Planned)

## Helpful Commands

```bash
# Install all dependencies
npm run setup

# Start development environment
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Build for production
npm run build

# Deploy frontend
npm run deploy
```

## Questions or Issues?

- Check the main README.md for comprehensive documentation
- Review DATABASE_SETUP_GUIDE.md for database setup
- Check deployment/README.md for deployment instructions
- Open an issue for bugs or feature requests

## When Assisting with Code

1. **Understand Context**: Consider the role (Admin/Student/Tutor) and feature area
2. **Follow Patterns**: Match existing code structure and naming conventions
3. **Security First**: Always consider authentication, authorization, and input validation
4. **Responsive Design**: Ensure UI works on mobile, tablet, and desktop
5. **Accessibility**: Include proper ARIA labels and semantic HTML
6. **Error Handling**: Implement proper error handling and user feedback
7. **Testing**: Consider test coverage for new features
8. **Documentation**: Update comments and documentation as needed

## Key Files to Reference

- `backend/src/server.js`: Backend entry point
- `frontend/src/App.js`: Frontend root component
- `backend/src/database/database_structure_only.sql`: Database schema
- `package.json`: Script commands and dependencies
- `.gitignore`: Files excluded from version control
- `render.yaml`: Deployment configuration
