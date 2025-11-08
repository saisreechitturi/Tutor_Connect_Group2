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

async function checkTutoringSessionsStructure() {
    console.log('🔍 Checking tutoring_sessions table structure...');

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check column structure of tutoring_sessions
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'tutoring_sessions'
            ORDER BY ordinal_position
        `;

        const result = await client.query(columnsQuery);
        console.log('\n📊 tutoring_sessions columns:');
        result.rows.forEach(row => {
            console.log(`   • ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
        });

        // Look for time-related columns
        const timeColumns = result.rows.filter(row =>
            row.column_name.includes('time') ||
            row.column_name.includes('start') ||
            row.column_name.includes('end') ||
            row.column_name.includes('session') ||
            row.column_name.includes('date')
        );

        console.log('\n🕐 Time-related columns:');
        timeColumns.forEach(row => {
            console.log(`   • ${row.column_name} (${row.data_type})`);
        });

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await client.end();
    }
}

checkTutoringSessionsStructure().catch(console.error);