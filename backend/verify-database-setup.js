const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration - using same logic as main app
const connectionConfig = {
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.DATABASE_PORT || process.env.DB_PORT || 5432,
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'TutorConnect',
    user: process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
    ssl: false
};

const pool = new Pool(connectionConfig);

async function verifyDatabaseSetup() {
    try {
        console.log('🔍 Verifying database setup...\n');

        // Check table structure
        const columns = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);

        console.log('📋 Users table structure:');
        columns.rows.forEach(row => {
            const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
            const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            console.log(`   ${row.column_name}: ${row.data_type}${length} ${nullable}`);
        });

        // Test insert with new fields
        console.log('\n🧪 Testing direct database insert...');
        const testInsert = await pool.query(`
            INSERT INTO users (
                first_name, last_name, email, password_hash, role, 
                phone, date_of_birth, address, pincode
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) RETURNING id, first_name, last_name, email, phone, date_of_birth, address, pincode
        `, [
            'Database',
            'Test',
            `db.test.${Date.now()}@example.com`,
            'hashedpassword',
            'student',
            '1234567890',
            '1990-01-01',
            '123 Database Test St, Test City, TC 12345',
            '12345'
        ]);

        const newUser = testInsert.rows[0];
        console.log('✅ Direct database insert successful!');
        console.log('   User ID:', newUser.id);
        console.log('   Name:', newUser.first_name, newUser.last_name);
        console.log('   Email:', newUser.email);
        console.log('   Phone:', newUser.phone);
        console.log('   Date of Birth:', newUser.date_of_birth);
        console.log('   Address:', newUser.address);
        console.log('   Pincode:', newUser.pincode);

        // Clean up test data
        await pool.query('DELETE FROM users WHERE id = $1', [newUser.id]);
        console.log('🧹 Test data cleaned up');

        console.log('\n🎉 Database setup verification complete!');
        console.log('The database is ready to accept registrations with date of birth, address, and pincode.');

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
    } finally {
        await pool.end();
    }
}

verifyDatabaseSetup();