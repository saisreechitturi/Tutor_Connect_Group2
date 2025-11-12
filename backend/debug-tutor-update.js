const { query, connectDatabase } = require('./src/database/connection');

async function debugTutorProfileUpdate() {
    try {
        await connectDatabase();

        console.log('🧪 Debugging Tutor Profile Update Issues...');

        // Get all tutor users
        console.log('\n👤 Checking all tutor users:');
        const tutors = await query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
                   CASE WHEN tp.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile
            FROM users u
            LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor'
            ORDER BY u.created_at DESC
        `);

        tutors.rows.forEach(tutor => {
            console.log(`  - ${tutor.first_name} ${tutor.last_name} (${tutor.email})`);
            console.log(`    ID: ${tutor.id}`);
            console.log(`    Role: ${tutor.role}`);
            console.log(`    Active: ${tutor.is_active}`);
            console.log(`    Has Profile: ${tutor.has_profile}`);
            console.log('');
        });

        if (tutors.rows.length > 0) {
            const testTutor = tutors.rows[0];

            console.log(`\n🔍 Testing with tutor: ${testTutor.email}`);

            // Check if the role query works correctly
            console.log('\n📋 Testing role check query:');
            const roleCheck = await query('SELECT role FROM users WHERE id = $1', [testTutor.id]);
            console.log('Role check result:', roleCheck.rows);

            if (roleCheck.rows.length === 0) {
                console.log('❌ User not found in role check!');
            } else if (roleCheck.rows[0].role !== 'tutor') {
                console.log(`❌ User role is '${roleCheck.rows[0].role}', not 'tutor'!`);
            } else {
                console.log('✅ Role check passed');
            }

            // Check tutor profile table structure
            console.log('\n📊 Checking tutor_profiles table:');
            const profileStructure = await query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'tutor_profiles' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);

            console.log('Tutor profiles columns:');
            profileStructure.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });

            // Check if the tutor has a profile entry
            console.log('\n📄 Current tutor profile:');
            const currentProfile = await query('SELECT * FROM tutor_profiles WHERE user_id = $1', [testTutor.id]);

            if (currentProfile.rows.length === 0) {
                console.log('❌ No tutor profile found! This might be the issue.');

                // Check if we need to create a profile entry
                console.log('\n🔧 Creating default tutor profile...');
                await query(`
                    INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience)
                    VALUES ($1, 0.00, 0)
                    ON CONFLICT (user_id) DO NOTHING
                `, [testTutor.id]);

                console.log('✅ Default tutor profile created');
            } else {
                console.log('✅ Tutor profile exists:');
                const profile = currentProfile.rows[0];
                console.log(`  - Experience: ${profile.years_of_experience} years`);
                console.log(`  - Rate: $${profile.hourly_rate}/hour`);
                console.log(`  - Education: ${profile.education_background || 'Not set'}`);
                console.log(`  - Languages: ${profile.languages_spoken || 'Not set'}`);
            }

            // Test the actual update query
            console.log('\n🔧 Testing profile update query...');
            const testUpdate = await query(`
                UPDATE tutor_profiles
                SET hourly_rate = $2, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
                RETURNING user_id, hourly_rate
            `, [testTutor.id, 50.00]);

            if (testUpdate.rows.length > 0) {
                console.log('✅ Update successful:', testUpdate.rows[0]);
            } else {
                console.log('❌ Update failed - no rows affected');
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        process.exit(0);
    }
}

debugTutorProfileUpdate();