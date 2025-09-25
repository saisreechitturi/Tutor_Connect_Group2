# Environment Configuration Guide

This guide explains how to use the different environment configurations for local development and UTA cloud deployment.

## Environment Files Structure

```
Tutor_Connect_Group2/
├── backend/
│   ├── .env.local          # Local development template
│   ├── .env.cloud          # UTA cloud deployment template
│   └── .env                # [WARNING] Active environment (not in git)
├── frontend/
│   ├── .env.local          # Local development template
│   ├── .env.cloud          # UTA cloud deployment template
│   └── .env.production     # [WARNING] Active production environment (not in git)
├── setup-local.sh          # Setup script for local dev (Bash)
├── setup-local.ps1         # Setup script for local dev (PowerShell)
├── setup-uta-cloud.sh     # Setup script for UTA deployment (Bash)
└── setup-uta-cloud.ps1    # Setup script for UTA deployment (PowerShell)
```

## Local Development Setup

### Quick Setup (Windows - PowerShell)

```powershell
# Run this in the project root
.\setup-local.ps1
```

### Quick Setup (Linux/Mac - Bash)

```bash
# Run this in the project root
chmod +x setup-local.sh
./setup-local.sh
```

### Manual Setup

1. **Backend Environment**:

   ```bash
   cd backend
   cp .env.local .env
   # Edit .env with your local PostgreSQL credentials
   ```

2. **Frontend Environment**:

   ```bash
   cd frontend
   # .env.local is automatically used by React in development
   # No copying needed - React reads .env.local automatically
   ```

3. **Update Local Database Settings**:
   Edit `backend/.env` with your local PostgreSQL settings:

   ```bash
   DATABASE_HOST=localhost
   DATABASE_NAME=tutorconnect_dev
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_local_password
   ```

### Local Development Workflow

```bash
# Start backend (from backend directory)
cd backend
npm install
npm run dev

# Start frontend (from frontend directory) 
cd frontend
npm install
npm start
```

## UTA Cloud Deployment Setup

### Quick Setup (Windows - PowerShell)

```powershell
# Run this in the project root
.\setup-uta-cloud.ps1
```

### Quick Setup (Linux/Mac - Bash)  

```bash
# Run this in the project root
chmod +x setup-uta-cloud.sh
./setup-uta-cloud.sh
```

### Manual Setup

1. **Backend Environment**:

   ```bash
   cd backend
   # Copy the UTA cloud environment template
   cp .env.cloud .env
   # Edit .env with your UTA PostgreSQL credentials
   ```

2. **Frontend Environment**:

   ```bash
   cd frontend
   cp .env.cloud .env.production
   # Edit .env.production with your UTA backend URL
   ```

3. **Update UTA Cloud Settings**:
   - Edit `backend/.env` with UTA PostgreSQL credentials
   - Edit `frontend/.env.production` with UTA backend URL

### UTA Cloud Deployment Workflow

```bash
# 1. Deploy database (run once)
sudo -u postgres psql -f deployment/setup-database.sql

# 2. Deploy backend
cd backend
../deployment/deploy-backend.sh

# 3. Deploy frontend
cd frontend  
../deployment/deploy-frontend.sh
```

## Environment Variables Reference

### Backend Variables

| Variable | Local (.env.local) | UTA Cloud (.env.cloud) | Description |
|----------|-------------------|---------------------------|-------------|
| `DATABASE_HOST` | `localhost` | `your-uta-postgres-host.uta.edu` | Database host |
| `DATABASE_NAME` | `tutorconnect_dev` | `tutorconnect` | Database name |
| `DATABASE_USER` | `postgres` | `tutorconnect_user` | Database user |
| `NODE_ENV` | `development` | `production` | Node environment |
| `PORT` | `5000` | `5000` | Server port |
| `FRONTEND_URL` | `http://localhost:3000` | `https://your-tutor-connect.uta.edu` | Frontend URL for CORS |
| `DB_SSL_REQUIRED` | `false` | `true` | SSL for database |
| `LOG_LEVEL` | `debug` | `info` | Logging level |

### Frontend Variables

| Variable | Local (.env.local) | UTA Cloud (.env.cloud) | Description |
|----------|-------------------|-------------------------------------|-------------|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | `https://your-tutor-connect-api.uta.edu/api` | Backend API URL |
| `REACT_APP_ENVIRONMENT` | `development` | `production` | Environment identifier |
| `REACT_APP_DEBUG_MODE` | `true` | `false` | Debug features |
| `GENERATE_SOURCEMAP` | `true` (default) | `false` | Source maps in build |

## Security Notes

### Environment Files Security

- [INFO] **Template files** (`.env.local`, `.env.cloud`) are in git
- [WARNING] **Active environment files** (`.env`, `.env.production`) are **NOT** in git
- [SECURITY] **Never commit actual secrets** - templates contain placeholders only

### JWT Secrets

- **Local**: Use any secure string for development
- **Production**: Use a strong 64+ character secret, different from local

### Database Passwords

- **Local**: Use a simple password for development
- **Production**: Use a strong, unique password for UTA cloud

## Troubleshooting

### Common Issues

1. **Backend can't connect to database**:
   - Check if PostgreSQL is running
   - Verify database credentials in `backend/.env`
   - Check if database exists

2. **Frontend can't reach backend API**:
   - Verify `REACT_APP_API_URL` in frontend environment
   - Check if backend is running
   - Verify CORS settings

3. **Environment variables not loading**:
   - Restart the application after changing `.env` files
   - Check file names (`.env` not `.env.txt`)
   - Ensure no spaces around `=` in environment files

### Development Tips

1. **Switching Environments**:

   ```bash
   # Switch to local development
   ./setup-local.sh    # or .\setup-local.ps1 on Windows
   
   # Switch to UTA cloud deployment
   ./setup-uta-cloud.sh  # or .\setup-uta-cloud.ps1 on Windows
   ```

2. **Checking Current Environment**:

   ```bash
   # Backend
   cd backend && node -e "console.log('Environment:', process.env.NODE_ENV)"
   
   # Check if .env exists
   ls -la backend/.env
   ```

3. **Testing Environment Variables**:

   ```bash
   # Backend - check database connection
   cd backend && npm run test:db
   
   # Frontend - check API URL (in browser console)
   console.log(process.env.REACT_APP_API_URL)
   ```

## Best Practices

1. **Always use setup scripts** to switch environments
2. **Never hardcode sensitive values** - use environment variables
3. **Use different JWT secrets** for local and production
4. **Test locally** before deploying to UTA cloud
5. **Keep environment templates updated** when adding new variables
6. **Document any new environment variables** in this guide

---

## Quick Reference

### Local Development

```bash
.\setup-local.ps1        # Windows
./setup-local.sh         # Linux/Mac
cd backend && npm run dev
cd frontend && npm start
```

### UTA Cloud Deployment

```bash
.\setup-uta-cloud.ps1    # Windows
./setup-uta-cloud.sh     # Linux/Mac
# Deploy following UTA deployment guide
```
