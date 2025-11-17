const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'TutorConnect',
    user: 'postgres',
    password: 'Akhil123',
    ssl: false,
});

async function checkDatabaseData() {
    try {
        console.log('Connecting to database...');

        // Check users
        const usersResult = await pool.query('SELECT COUNT(*), role FROM users WHERE is_active = true GROUP BY role');
        console.log('\nUser counts by role:');
        usersResult.rows.forEach(row => {
            console.log(`  ${row.role}: ${row.count}`);
        });

        // Check tutors specifically
        const tutorsResult = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, tp.hourly_rate
            FROM users u
            JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor' AND u.is_active = true
            LIMIT 5
        `);
        console.log('\nSample tutors:');
        tutorsResult.rows.forEach(row => {
            console.log(`  ${row.first_name} ${row.last_name} - $${row.hourly_rate}/hr (ID: ${row.id})`);
        });

        // Check subjects
        const subjectsResult = await pool.query('SELECT COUNT(*) FROM subjects WHERE is_active = true');
        console.log(`\nActive subjects: ${subjectsResult.rows[0].count}`);

        // Check tutor-subject relationships
        const tutorSubjectsResult = await pool.query('SELECT COUNT(*) FROM tutor_subjects');
        console.log(`Tutor-subject relationships: ${tutorSubjectsResult.rows[0].count}`);

        // Check availability slots
        const availabilityResult = await pool.query('SELECT COUNT(*) FROM tutor_availability_slots');
        console.log(`Availability slots: ${availabilityResult.rows[0].count}`);

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await pool.end();
    }
}

checkDatabaseData();