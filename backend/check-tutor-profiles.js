const { query, connectDatabase } = require('./src/database/connection');

async function checkTutorProfiles() {
    try {
        await connectDatabase();

        console.log('👤 Checking users and their roles...');
        const users = await query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                   CASE WHEN tp.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_tutor_profile
            FROM users u
            LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor'
            ORDER BY u.created_at DESC
        `);

        console.log('\n📋 Tutors in the system:');
        users.rows.forEach(user => {
            console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
            console.log(`    ID: ${user.id}`);
            console.log(`    Has Profile: ${user.has_tutor_profile}`);
            console.log(`    Created: ${user.created_at}`);
            console.log('');
        });

        console.log('🔍 Checking tutor profiles in detail...');
        const profiles = await query(`
            SELECT tp.*, u.email, u.first_name, u.last_name
            FROM tutor_profiles tp
            JOIN users u ON tp.user_id = u.id
        `);

        console.log('\n📊 Tutor Profiles Details:');
        profiles.rows.forEach(profile => {
            console.log(`  - ${profile.first_name} ${profile.last_name} (${profile.email})`);
            console.log(`    User ID: ${profile.user_id}`);
            console.log(`    Experience: ${profile.years_of_experience} years`);
            console.log(`    Rate: $${profile.hourly_rate}/hour`);
            console.log(`    Languages: ${profile.languages_spoken}`);
            console.log(`    Updated: ${profile.updated_at}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        process.exit(0);
    }
}

checkTutorProfiles();