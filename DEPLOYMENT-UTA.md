# Tutor Connect - UTA Cloud Deployment Guide

This guide covers deploying the Tutor Connect application to UTA cloud infrastructure with PostgreSQL database support.

## Architecture Overview

- **Backend**: Node.js/Express API server
- **Frontend**: React SPA (Single Page Application)  
- **Database**: PostgreSQL on UTA cloud infrastructure
- **Hosting**: UTA cloud servers

## Prerequisites

Before deploying, ensure you have:

- [x] Access to UTA cloud infrastructure
- [x] PostgreSQL database instance on UTA cloud
- [x] Node.js 16+ installed on the target server
- [x] Git access to clone the repository
- [x] Web server (Apache/Nginx) access for frontend hosting

## Deployment Process

### Step 1: Database Setup

1. **Access your UTA PostgreSQL instance**:

   ```bash
   # Connect to your UTA PostgreSQL server
   psql -h your-uta-db-host -U postgres
   ```

2. **Run the database setup script**:

   ```bash
   # From the project root
   sudo -u postgres psql -f deployment/setup-database.sql
   ```

3. **Create the database schema**:

   ```bash
   # Option 1: Run the schema file directly
   psql -h your-uta-db-host -U tutorconnect_user -d tutorconnect -f backend/docs/database-schema.sql
   
   # Option 2: Use the Node.js migration (after backend setup)
   cd backend && npm run migrate
   ```

### Step 2: Backend Deployment

1. **Clone and setup the backend**:

   ```bash
   # Clone the repository (if not already done)
   git clone https://github.com/yourusername/Tutor_Connect_Group2.git
   cd Tutor_Connect_Group2/backend
   
   # Install dependencies
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   # Copy the UTA cloud environment template
   cp .env.cloud .env
   
   # Edit with your actual UTA cloud database credentials
   nano .env
   ```

3. **Deploy the backend**:

   ```bash
   # Make the deployment script executable
   chmod +x ../deployment/deploy-backend.sh
   
   # Run the deployment
   ../deployment/deploy-backend.sh
   ```

4. **Set up process management** (recommended):

   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the API with PM2
   pm2 start src/server.js --name tutor-connect-api
   pm2 startup
   pm2 save
   ```

### Step 3: Frontend Deployment

1. **Setup the frontend**:

   ```bash
   cd ../frontend
   
   # Install dependencies  
   npm install
   ```

2. **Configure API endpoint**:

   ```bash
   # Configure environment file for production
   cp .env.cloud .env.production
   # Edit .env.production with your actual UTA backend URL
   ```

3. **Build and deploy**:

   ```bash
   # Make the deployment script executable
   chmod +x ../deployment/deploy-frontend.sh
   
   # Run the deployment
   ../deployment/deploy-frontend.sh
   ```

4. **Configure web server** (Apache/Nginx):
   - Serve the built React files from `frontend/build/`
   - Configure reverse proxy for API calls to the backend
   - Set up SSL certificates if using HTTPS

## Environment Variables

### Backend Environment (.env)

```bash
# Database Configuration
DATABASE_HOST=your-uta-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=tutorconnect
DATABASE_USER=tutorconnect_user
DATABASE_PASSWORD=your-secure-password

# Or use connection string format
DATABASE_URL=postgresql://tutorconnect_user:password@host:5432/tutorconnect

# Application Settings
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-uta-frontend-domain.com
```

### Frontend Environment (.env.production)

```bash
REACT_APP_API_URL=https://your-uta-backend-url.com/api
```

## Database Schema

The database schema is automatically created when you run:

- The setup script: `deployment/setup-database.sql`
- The migration: `backend/docs/database-schema.sql`

### Tables Created

- `users` - User accounts and profiles
- `tutor_profiles` - Tutor-specific information
- `subjects` - Available subjects for tutoring
- `sessions` - Tutoring session records
- `tasks` - Task management
- `messages` - Messaging system
- `calendar_events` - Calendar integration
- `notifications` - User notifications
- `user_sessions` - Active user sessions

## Web Server Configuration

### Apache Configuration Example

```apache
<VirtualHost *:443>
    ServerName your-domain.uta.edu
    DocumentRoot /path/to/frontend/build
    
    # Serve React app
    <Directory "/path/to/frontend/build">
        AllowOverride All
        Require all granted
        
        # Handle React Router
        FallbackResource /index.html
    </Directory>
    
    # Proxy API requests to backend
    ProxyPass /api/ http://localhost:5000/api/
    ProxyPassReverse /api/ http://localhost:5000/api/
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/private.key
</VirtualHost>
```

### Nginx Configuration Example

```nginx
server {
    listen 443 ssl;
    server_name your-domain.uta.edu;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Serve React app
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check UTA cloud firewall settings
   - Verify database credentials
   - Ensure PostgreSQL is accepting connections

2. **Backend API Not Starting**:

   ```bash
   # Check logs
   pm2 logs tutor-connect-api
   
   # Restart the service
   pm2 restart tutor-connect-api
   ```

3. **Frontend Not Loading**:
   - Check web server configuration
   - Verify build files are in the correct directory
   - Check browser console for errors

4. **API Calls Failing**:
   - Verify CORS settings in backend
   - Check `REACT_APP_API_URL` environment variable
   - Ensure backend is accessible from frontend URL

### Log Locations

- Backend logs: PM2 logs or console output
- Web server logs: `/var/log/apache2/` or `/var/log/nginx/`
- Database logs: PostgreSQL log directory

## Support

For UTA cloud-specific issues:

- Contact UTA IT support
- Check UTA cloud documentation
- Verify network and security policies

For application issues:

- Check the GitHub repository issues
- Review application logs
- Test API endpoints manually

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pm2 restart tutor-connect-api

# Update frontend
cd ../frontend
npm install
npm run build
# Copy new build files to web server directory
```

### Database Backups

```bash
# Create backup
pg_dump -h your-uta-db-host -U tutorconnect_user tutorconnect > backup.sql

# Restore backup
psql -h your-uta-db-host -U tutorconnect_user tutorconnect < backup.sql
```

---

**[SUCCESS] Your Tutor Connect application is now deployed on UTA cloud infrastructure!**

Access your application at: `https://your-domain.uta.edu`
