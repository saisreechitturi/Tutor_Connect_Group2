const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'TutorConnect',
    user: 'postgres',
    password: 'admin',
    ssl: false,
});

async function cleanupTaskAssignments() {
    try {
        console.log('🧹 Cleaning up task assignments...\n');

        // First, let's see what we have
        const allTasksResult = await pool.query(`
            SELECT t.id, t.title, t.user_id, u.first_name, u.last_name, u.email 
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at
        `);

        console.log('Current task assignments:');
        allTasksResult.rows.forEach(row => {
            console.log(`  Task: "${row.title}" → User: ${row.first_name} ${row.last_name} (${row.email})`);
        });

        // Check if there are users without their own tasks
        const usersResult = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                   COUNT(t.id) as task_count
            FROM users u
            LEFT JOIN tasks t ON u.id = t.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
            ORDER BY u.created_at
        `);

        console.log('\nUsers and their task counts:');
        usersResult.rows.forEach(row => {
            console.log(`  ${row.first_name} ${row.last_name} (${row.role}): ${row.task_count} tasks`);
        });

        // For demo purposes, we could create sample tasks for each user
        // But let's not automatically assign tasks - users should create their own
        console.log('\n✅ Task assignments reviewed. Each user should create their own tasks.');

    } catch (error) {
        console.error('❌ Error cleaning up task assignments:', error);
    } finally {
        await pool.end();
    }
}

cleanupTaskAssignments();