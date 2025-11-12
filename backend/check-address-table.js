require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DB_SSL_REQUIRED === 'true'
});

async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

async function checkAddressTable() {
    console.log('\n=== Checking user_addresses Table Structure ===');

    try {
        // Check if table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_addresses'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ user_addresses table does NOT exist');
            return;
        }

        console.log('✅ user_addresses table exists');

        // Get column structure
        console.log('\n📋 Table columns:');
        const columns = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_addresses'
            ORDER BY ordinal_position
        `);

        columns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkAddressTable();