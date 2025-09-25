# UTA Cloud Deployment Scripts

This directory contains deployment scripts and configuration files for deploying Tutor Connect to UTA cloud infrastructure.

## Files Overview

### `deploy-backend.sh`

Shell script to deploy the Node.js/Express backend to UTA cloud servers.

**Usage:**

```bash
cd backend
chmod +x ../deployment/deploy-backend.sh
../deployment/deploy-backend.sh
```

### `deploy-frontend.sh`

Shell script to build and prepare the React frontend for deployment on UTA cloud.

**Usage:**

```bash
cd frontend
chmod +x ../deployment/deploy-frontend.sh
../deployment/deploy-frontend.sh
```

### `setup-database.sql`

PostgreSQL script to create the database, user, and initial setup on UTA cloud PostgreSQL instance.

**Usage:**

```bash
sudo -u postgres psql -f deployment/setup-database.sql
```

### `UTA-CLOUD-CONFIG.md`

Detailed configuration guide specific to UTA cloud infrastructure requirements.

## Prerequisites

Before using these scripts:

1. **Access to UTA Cloud Infrastructure**
   - Server access with Node.js 16+ installed
   - PostgreSQL database instance
   - Web server (Apache/Nginx) access

2. **Environment Configuration**
   - Copy `backend/.env.uta-cloud` to `backend/.env`
   - Copy `frontend/.env.uta-production` to `frontend/.env.production`
   - Update all configuration values with your actual UTA cloud details

3. **Permissions**
   - Make scripts executable: `chmod +x deployment/*.sh`
   - Ensure proper file system permissions for web server directory

## Deployment Order

1. **Database Setup** (run once)
2. **Backend Deployment**
3. **Frontend Build and Deployment**
4. **Web Server Configuration**

## Support

For UTA cloud-specific configuration help, refer to:

- UTA IT documentation
- `UTA-CLOUD-CONFIG.md` in this directory
- Main `DEPLOYMENT-UTA.md` guide
