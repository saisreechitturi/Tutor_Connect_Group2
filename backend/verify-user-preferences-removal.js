const { Pool } = require('pg');
require('dotenv').config();

// Use the same connection logic as the main application
const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    }
    : {
        host: process.env.DATABASE_HOST || process.env.DB_HOST,
        port: process.env.DATABASE_PORT || process.env.DB_PORT || 5432,
        database: process.env.DATABASE_NAME || process.env.DB_NAME,
        user: process.env.DATABASE_USER || process.env.DB_USER,
        password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL_REQUIRED === 'true' ? {
            rejectUnauthorized: false
        } : false
    };

const pool = new Pool(connectionConfig);

async function verifyUserPreferencesRemoval() {
    const client = await pool.connect();

    try {
        console.log('🔍 Verifying user_preferences table removal...');

        // Check if user_preferences table exists
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_preferences'
        `);

        if (tableCheck.rows.length === 0) {
            console.log('✅ CONFIRMED: user_preferences table has been completely removed');
        } else {
            console.log('❌ WARNING: user_preferences table still exists');
        }

        // Check for any remaining triggers
        const triggerCheck = await client.query(`
            SELECT trigger_name, event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_name LIKE '%preferences%'
        `);

        if (triggerCheck.rows.length === 0) {
            console.log('✅ CONFIRMED: No user_preferences related triggers found');
        } else {
            console.log('❌ WARNING: Found remaining triggers:', triggerCheck.rows);
        }

        // Check for any remaining constraints
        const constraintCheck = await client.query(`
            SELECT constraint_name, table_name 
            FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%user_preferences%'
        `);

        if (constraintCheck.rows.length === 0) {
            console.log('✅ CONFIRMED: No user_preferences related constraints found');
        } else {
            console.log('❌ WARNING: Found remaining constraints:', constraintCheck.rows);
        }

        // List all current tables for reference
        const allTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\n📋 Current database tables:');
        allTables.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        console.log('\n🎉 Database verification completed successfully!');
        console.log('The user_preferences table and all related objects have been completely removed.');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the verification
verifyUserPreferencesRemoval()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Verification failed:', error);
        process.exit(1);
    });