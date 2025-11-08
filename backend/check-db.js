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

async function checkDatabase() {
    console.log('🔍 Checking database structure...');

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check existing tables
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        const result = await client.query(tablesQuery);
        console.log('\n📊 Existing tables:');
        result.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        // Check if payments table exists (referenced in migration)
        const paymentsCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'payments'
        `);

        if (paymentsCheck.rows.length === 0) {
            console.log('\n❌ WARNING: "payments" table does not exist but is referenced in migration');
            console.log('   Migration may need to be adjusted');
        } else {
            console.log('\n✅ "payments" table exists');
        }

        // Check if session_reviews table exists (referenced in function)
        const reviewsCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'session_reviews'
        `);

        if (reviewsCheck.rows.length === 0) {
            console.log('❌ WARNING: "session_reviews" table does not exist but is referenced in function');
        } else {
            console.log('✅ "session_reviews" table exists');
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await client.end();
    }
}

checkDatabase().catch(console.error);