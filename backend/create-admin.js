const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

async function createAdminUser() {
    const pool = new Pool({
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        database: process.env.DATABASE_NAME || 'TutorConnect',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'admin',
        ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('Creating admin user...');

        // Check if admin user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@demo.com']);

        if (existingUser.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash('Demo1234', saltRounds);

        // Create admin user
        const result = await pool.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role, first_name, last_name
    `, ['admin@demo.com', passwordHash, 'admin', 'Admin', 'User', true, true]);

        console.log('Admin user created successfully:', result.rows[0]);
    } catch (error) {
        console.error('Error creating admin user:', error.message);
    } finally {
        await pool.end();
    }
}

createAdminUser();