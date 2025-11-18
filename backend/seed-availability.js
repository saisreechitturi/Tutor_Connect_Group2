const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'TutorConnect',
    user: 'postgres',
    password: 'admin',
    ssl: false
});

async function seedAvailability() {
    try {
        const sql = fs.readFileSync('./src/database/migrations/seed_availability_data.sql', 'utf8');
        console.log('Seeding availability data...');

        await pool.query(sql);

        console.log('Availability data seeded successfully!');

        // Check what we inserted
        const result = await pool.query(`
      SELECT u.first_name, u.last_name, s.day_of_week, s.start_time, s.end_time
      FROM tutor_availability_slots s
      JOIN users u ON s.tutor_id = u.id
      ORDER BY u.first_name, s.day_of_week, s.start_time
    `);

        console.log('Sample availability slots:');
        result.rows.slice(0, 10).forEach(row => {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            console.log(`${row.first_name} ${row.last_name}: ${dayNames[row.day_of_week]} ${row.start_time}-${row.end_time}`);
        });

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await pool.end();
    }
}

seedAvailability();