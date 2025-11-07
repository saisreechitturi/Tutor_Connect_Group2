// Load environment variables
require('dotenv').config();

const { query, connectDatabase } = require('../database/connection');

async function checkTables() {
    try {
        console.log('🔍 Checking existing database tables...');

        // Connect to database
        await connectDatabase();
        console.log('✅ Connected to database');

        // Get list of tables
        const result = await query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('\n📋 Existing tables:');
        if (result.rows.length === 0) {
            console.log('   No tables found in public schema');
        } else {
            result.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }

        // Check if subjects table exists
        const subjectsCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'subjects'
            );
        `);

        console.log(`\n🔍 Subjects table exists: ${subjectsCheck.rows[0].exists}`);

        // Check if tasks table exists
        const tasksCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'tasks'
            );
        `);

        console.log(`🔍 Tasks table exists: ${tasksCheck.rows[0].exists}`);

        process.exit(0);

    } catch (error) {
        console.error('💥 Error checking tables:', error.message);
        process.exit(1);
    }
}

checkTables();