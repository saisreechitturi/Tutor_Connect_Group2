// Load environment variables
require('dotenv').config();

const { query, connectDatabase } = require('../database/connection');

async function checkTasksTable() {
    try {
        console.log('🔍 Checking tasks table structure...');

        // Connect to database
        await connectDatabase();
        console.log('✅ Connected to database');

        // Get tasks table columns
        const result = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tasks'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Tasks table columns:');
        if (result.rows.length === 0) {
            console.log('   No columns found (table might not exist)');
        } else {
            result.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type}${row.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
            });
        }

        // Check tasks table indexes
        const indexResult = await query(`
            SELECT indexname, indexdef
            FROM pg_indexes 
            WHERE tablename = 'tasks' 
            AND schemaname = 'public'
            ORDER BY indexname;
        `);

        console.log('\n🔍 Tasks table indexes:');
        if (indexResult.rows.length === 0) {
            console.log('   No indexes found');
        } else {
            indexResult.rows.forEach(row => {
                console.log(`   - ${row.indexname}`);
            });
        }

        // Test a simple query on tasks table
        const testResult = await query('SELECT COUNT(*) as task_count FROM tasks');
        console.log(`\n📊 Current tasks count: ${testResult.rows[0].task_count}`);

        process.exit(0);

    } catch (error) {
        console.error('💥 Error checking tasks table:', error.message);
        process.exit(1);
    }
}

checkTasksTable();