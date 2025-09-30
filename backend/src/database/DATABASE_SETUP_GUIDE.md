# 🗃️ Database Setup Options for TutorConnect

You have **three ways** to set up your TutorConnect database, depending on your needs:

## 📊 **Option 1: Use Your Complete Database Backup (Recommended)**

If you have a full database backup with both structure and data:

### **Prerequisites:**

- PostgreSQL service running
- Empty `TutorConnect` database created

### **Steps:**

```bash
# 1. Start PostgreSQL service (Run PowerShell as Administrator)
Start-Service postgresql-x64-17

# 2. Create empty database
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres TutorConnect

# 3. Restore from your backup file
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -f "path\to\your\backup.sql"
```

### **What you get:**

- ✅ Complete database structure
- ✅ All your existing data
- ✅ User accounts, sessions, messages, etc.
- ✅ Production-ready setup

---

## 🏗️ **Option 2: Structure Only (Empty Database)**

If you want just the database structure without any data:

### **Use the structure file:**

```bash
# 1. Create database
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres TutorConnect

# 2. Apply structure only
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d TutorConnect -f "database_structure_only.sql"
```

### **What you get:**

- ✅ All tables, indexes, and triggers
- ✅ No sample data
- ✅ Clean slate for development
- ✅ Ready for fresh data entry

---

## 🧪 **Option 3: Development Setup with Sample Data**

If you want a fresh development environment with sample users and data:

### **Use the npm scripts:**

```bash
cd backend

# Create structure + add sample data
npm run db:full-setup

# Or step by step:
npm run db:setup    # Structure only
npm run db:seed     # Add sample data
```

### **What you get:**

- ✅ Complete database structure
- ✅ Sample users (admin, tutors, students)
- ✅ Test subjects and sessions
- ✅ Demo data for development

---

## 🔧 **Current Configuration**

Your `.env.local` is set up with:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=TutorConnect
DATABASE_USER=postgres
DATABASE_PASSWORD=Admin
```

## 🧪 **Testing Your Setup**

After setting up the database, test the connection:

```bash
cd backend

# Test connection
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
});
pool.query('SELECT current_user, version()', (err, res) => {
  if (err) {
    console.log('❌ Connection failed:', err.message);
  } else {
    console.log('✅ Connection successful!');
    console.log('User:', res.rows[0].current_user);
    console.log('Database:', process.env.DATABASE_NAME);
  }
  pool.end();
});
"
```

## 📋 **Quick Reference**

| Method | Structure | Data | Use Case |
|--------|-----------|------|----------|
| **Your Backup** | ✅ | ✅ Your Data | Production/Transfer |
| **Structure Only** | ✅ | ❌ | Clean Development |
| **Sample Data** | ✅ | ✅ Demo Data | Learning/Testing |

## 🚀 **Next Steps**

After database setup:

1. **Start the application:**

   ```bash
   cd backend && npm run dev
   cd frontend && npm start
   ```

2. **Access the app:** <http://localhost:3000/Tutor_Connect_Group2>

3. **Test login** with your existing accounts or demo accounts

---

**💡 Tip:** Since you have a complete backup with real data, **Option 1** is recommended for preserving your work!
