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

async function fixDatabase() {
    console.log('\n=== COMPREHENSIVE DATABASE FIXES ===');

    try {
        const userEmail = 'abhinaykotla@gmail.com';

        // 1. Get user info
        console.log(`🔍 1. Checking user: ${userEmail}`);
        const userResult = await query('SELECT id, email, role FROM users WHERE email = $1', [userEmail]);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log(`   ✅ User found: ${user.id} (role: ${user.role})`);

        // 2. Fix tutor profile if needed
        console.log('\n🎓 2. Fixing tutor profile...');
        const tutorProfileResult = await query('SELECT * FROM tutor_profiles WHERE user_id = $1', [user.id]);

        if (tutorProfileResult.rows.length === 0) {
            console.log('   ➕ Creating tutor profile...');
            await query(`
                INSERT INTO tutor_profiles (user_id, years_of_experience, hourly_rate)
                VALUES ($1, 0, 0.00)
                ON CONFLICT (user_id) DO NOTHING
            `, [user.id]);
            console.log('   ✅ Tutor profile created');
        } else {
            console.log('   ✅ Tutor profile exists');
        }

        // 3. Clear existing data for fresh start
        console.log('\n🧹 3. Cleaning existing data...');
        await query('DELETE FROM tutor_subjects WHERE tutor_id = $1', [user.id]);
        await query('DELETE FROM tutor_availability_slots WHERE tutor_id = $1', [user.id]);
        console.log('   ✅ Old data cleared');

        // 4. Check subjects table
        console.log('\n📚 4. Checking subjects...');
        const subjectsResult = await query('SELECT id, name FROM subjects ORDER BY name');
        console.log(`   ✅ Found ${subjectsResult.rows.length} subjects:`);
        subjectsResult.rows.forEach(subject => {
            console.log(`      - ${subject.id}: ${subject.name}`);
        });

        // 5. Test profile update endpoint access
        console.log('\n🔧 5. Testing database constraints...');

        // Check if there are any constraints causing the 403 error
        const constraintsResult = await query(`
            SELECT conname, confrelid::regclass as foreign_table, af.attname as column_name
            FROM pg_constraint c
            JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
            WHERE c.conrelid = 'tutor_profiles'::regclass AND c.contype = 'f'
        `);

        console.log('   📋 Tutor profile constraints:');
        if (constraintsResult.rows.length > 0) {
            constraintsResult.rows.forEach(constraint => {
                console.log(`      - ${constraint.conname}: references ${constraint.foreign_table}.${constraint.column_name}`);
            });
        } else {
            console.log('      ✅ No problematic constraints found');
        }

        // 6. Check tutor_profiles table structure
        console.log('\n📋 6. Checking tutor_profiles structure...');
        const structureResult = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tutor_profiles'
            ORDER BY ordinal_position
        `);

        structureResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
        });

        console.log('\n🎉 Database analysis and fixes completed!');
        console.log('\n📝 RECOMMENDED NEXT STEPS:');
        console.log('1. Clear browser localStorage');
        console.log('2. Use the 30-day token generated earlier');
        console.log('3. Try the tutor profile setup again');
        console.log('4. If still getting 403, check browser console for detailed error');

    } catch (error) {
        console.error('❌ Error during fixes:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixDatabase();