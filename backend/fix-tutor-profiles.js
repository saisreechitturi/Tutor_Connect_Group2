require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');

async function fixTutorProfiles() {
    try {
        await connectDatabase();

        console.log('🔧 Fixing Tutor Profile Issues...');

        // 1. Find all users with tutor role but no tutor profile
        const orphanTutors = await query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.role
            FROM users u
            LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor' AND tp.user_id IS NULL
        `);

        console.log(`\n📋 Found ${orphanTutors.rows.length} tutors without profiles:`);

        if (orphanTutors.rows.length > 0) {
            console.log('Creating default tutor profiles...');

            for (const tutor of orphanTutors.rows) {
                console.log(`  - Creating profile for ${tutor.first_name} ${tutor.last_name} (${tutor.email})`);

                await query(`
                    INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience, education_background, languages_spoken, preferred_teaching_method)
                    VALUES ($1, 0.00, 0, '', '["English"]', 'online')
                `, [tutor.id]);
            }

            console.log('✅ Default profiles created successfully!');
        } else {
            console.log('✅ All tutors already have profiles');
        }

        // 2. Check for any authentication/role issues
        console.log('\n👤 Verifying tutor users:');
        const allTutors = await query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
                   tp.hourly_rate, tp.years_of_experience
            FROM users u
            JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor'
            ORDER BY u.created_at DESC
        `);

        allTutors.rows.forEach(tutor => {
            console.log(`  ✅ ${tutor.first_name} ${tutor.last_name} (${tutor.email})`);
            console.log(`      ID: ${tutor.id}`);
            console.log(`      Role: ${tutor.role}, Active: ${tutor.is_active}`);
            console.log(`      Rate: $${tutor.hourly_rate}, Experience: ${tutor.years_of_experience} years`);
            console.log('');
        });

        console.log(`📊 Total tutors with complete profiles: ${allTutors.rows.length}`);

    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        process.exit(0);
    }
}

fixTutorProfiles();