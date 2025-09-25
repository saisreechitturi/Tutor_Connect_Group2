# UTA Cloud Deployment Configuration

## System Requirements

- Node.js 16+
- PostgreSQL 12+
- Git
- Web server (Apache/Nginx) for frontend static files

## Network Configuration

- Backend API: Port 5000 (or configure as needed)
- Frontend: Standard HTTP/HTTPS ports (80/443)
- Database: PostgreSQL default port 5432

## Environment Variables Required

Copy and configure these in your UTA cloud environment:

```bash
# Database
DATABASE_HOST=your-uta-postgres-ip
DATABASE_PORT=5432
DATABASE_NAME=tutorconnect
DATABASE_USER=tutorconnect_user
DATABASE_PASSWORD=your-secure-password

# Application
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-domain.uta.edu

# Optional: Use DATABASE_URL instead of individual params
DATABASE_URL=postgresql://tutorconnect_user:your-password@your-uta-postgres-ip:5432/tutorconnect
```

## Deployment Steps

### 1. Database Setup

```bash
# On your UTA PostgreSQL server
sudo -u postgres psql -f deployment/setup-database.sql
```

### 2. Backend Deployment

```bash
cd backend
chmod +x ../deployment/deploy-backend.sh
../deployment/deploy-backend.sh
```

### 3. Frontend Deployment

```bash
cd frontend
chmod +x ../deployment/deploy-frontend.sh
../deployment/deploy-frontend.sh
```

## Process Management

Consider using PM2 or similar process manager for the backend:

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name tutor-connect-api
pm2 startup
pm2 save
```

## Web Server Configuration (Apache/Nginx)

Configure your web server to:

- Serve frontend static files
- Proxy API requests to backend
- Handle HTTPS certificates
