const { Client } = require('pg');

// Database configuration
const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'TutorConnect',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'admin',
    ssl: process.env.DB_SSL_REQUIRED === 'true' ? { rejectUnauthorized: false } : false
};

async function checkTableStructure() {
    console.log('🔍 Checking tutor_availability_slots table structure...');

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Connected to database');

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