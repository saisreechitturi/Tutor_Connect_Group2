require('dotenv').config();
const { Pool } = require('pg');

// Create database connection
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

async function checkUserRole() {
    console.log('\n=== Checking User Role and Profile Status ===');

    const email = 'abhinaykotla@gmail.com'; // The user from the logs

    try {
        // Check user's role and basic info
        console.log(`🔍 Looking up user: ${email}`);
        const userResult = await query(`
            SELECT id, email, role, first_name, last_name, is_active, created_at
            FROM users 
            WHERE email = $1
        `, [email]);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('\n📋 User Details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Created: ${user.created_at}`);

        // Check if tutor profile exists
        console.log('\n🎓 Checking Tutor Profile:');
        const tutorResult = await query(`
            SELECT * FROM tutor_profiles WHERE user_id = $1
        `, [user.id]);

        if (tutorResult.rows.length > 0) {
            const tutorProfile = tutorResult.rows[0];
            console.log('   ✅ Tutor profile exists:');
            console.log(`   - Experience: ${tutorProfile.years_of_experience} years`);
            console.log(`   - Hourly Rate: $${tutorProfile.hourly_rate}`);
            console.log(`   - Education: ${tutorProfile.education_background}`);
            console.log(`   - Teaching Method: ${tutorProfile.preferred_teaching_method}`);
        } else {
            console.log('   ❌ No tutor profile found');
        }

        // Check tutor subjects
        console.log('\n📚 Checking Tutor Subjects:');
        const subjectsResult = await query(`
            SELECT ts.*, s.name as subject_name 
            FROM tutor_subjects ts
            JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.tutor_id = $1
        `, [user.id]);

        if (subjectsResult.rows.length > 0) {
            console.log('   ✅ Subjects found:');
            subjectsResult.rows.forEach(sub => {
                console.log(`   - ${sub.subject_name}`);
            });
        } else {
            console.log('   ❌ No subjects assigned');
        }

        // Check availability
        console.log('\n📅 Checking Availability:');
        const availabilityResult = await query(`
            SELECT * FROM tutor_availability WHERE tutor_id = $1
        `, [user.id]);

        if (availabilityResult.rows.length > 0) {
            console.log('   ✅ Availability slots found:');
            availabilityResult.rows.forEach(slot => {
                console.log(`   - ${slot.day_of_week}: ${slot.start_time} - ${slot.end_time}`);
            });
        } else {
            console.log('   ❌ No availability set');
        }

        // If user role is not 'tutor', offer to fix it
        if (user.role !== 'tutor') {
            console.log('\n⚠️  ISSUE FOUND: User role is not set to "tutor"');
            console.log('🔧 Fixing user role...');

            await query(`
                UPDATE users 
                SET role = 'tutor' 
                WHERE id = $1
            `, [user.id]);

            console.log('✅ User role updated to "tutor"');
        } else {
            console.log('\n✅ User role is correctly set to "tutor"');
        }

        console.log('\n🎉 Diagnosis complete!');

    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkUserRole();