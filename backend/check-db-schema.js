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

async function checkTables() {
    console.log('\n=== Database Schema Analysis ===');

    try {
        // Check availability-related tables
        console.log('\n🔍 Availability tables:');
        const availabilityResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%availability%'
            ORDER BY table_name
        `);

        if (availabilityResult.rows.length > 0) {
            availabilityResult.rows.forEach(row => {
                console.log(`   ✅ ${row.table_name}`);
            });
        } else {
            console.log('   ❌ No availability tables found');
        }

        // Check tutor-related tables
        console.log('\n🎓 Tutor tables:');
        const tutorResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%tutor%'
            ORDER BY table_name
        `);

        tutorResult.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });

        // Check subject tables
        console.log('\n📚 Subject tables:');
        const subjectResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%subject%'
            ORDER BY table_name
        `);

        subjectResult.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });

        // Show structure of availability table if it exists
        if (availabilityResult.rows.length > 0) {
            const tableName = availabilityResult.rows[0].table_name;
            console.log(`\n📋 ${tableName} structure:`);
            const structureResult = await query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            structureResult.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkTables();