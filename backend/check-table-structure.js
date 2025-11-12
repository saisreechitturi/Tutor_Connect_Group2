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

async function checkTableStructure() {
    console.log('\n=== Checking Database Table Structure ===');

    // Check column structure of tutor_availability_slots
    const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'tutor_availability_slots'
            ORDER BY ordinal_position
        `;

    const result = await client.query(columnsQuery);
    console.log('\n📊 tutor_availability_slots columns:');
    result.rows.forEach(row => {
        console.log(`   • ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });

    // Check if start_time column exists
    const startTimeCheck = result.rows.find(row => row.column_name === 'start_time');
    if (startTimeCheck) {
        console.log('\n✅ start_time column exists');
    } else {
        console.log('\n❌ start_time column does NOT exist');
        console.log('Available time-related columns:');
        result.rows.forEach(row => {
            if (row.column_name.includes('time') || row.column_name.includes('start') || row.column_name.includes('end')) {
                console.log(`   • ${row.column_name}`);
            }
        });
    }

} catch (error) {
    console.error('❌ Database check failed:', error.message);
} finally {
    await client.end();
}
}

checkTableStructure().catch(console.error);