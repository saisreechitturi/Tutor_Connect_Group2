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

async function createTestSessions() {
    try {
        const sql = fs.readFileSync('./src/database/migrations/create_test_sessions.sql', 'utf8');
        console.log('Creating test sessions...');

        await pool.query(sql);

        console.log('Test sessions created successfully!');

        // Show what we created
        const result = await pool.query(`
      SELECT ts.title, ts.scheduled_start, ts.scheduled_end, ts.status,
             t.first_name as tutor_name, s.first_name as student_name
      FROM tutoring_sessions ts
      JOIN users t ON ts.tutor_id = t.id
      JOIN users s ON ts.student_id = s.id
      WHERE ts.created_at > NOW() - INTERVAL '1 minute'
      ORDER BY ts.scheduled_start
    `);

        console.log('Created sessions:');
        result.rows.forEach(row => {
            console.log(`${row.title} - ${row.tutor_name} - ${row.scheduled_start} to ${row.scheduled_end} (${row.status})`);
        });

    } catch (error) {
        console.error('Creating test sessions failed:', error);
    } finally {
        await pool.end();
    }
}

createTestSessions();