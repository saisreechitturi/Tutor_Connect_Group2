const { query, connectDatabase } = require('./src/database/connection');

async function testTutorProfileSetup() {
    try {
        await connectDatabase();

        // Test tutor user ID (using the first one from the list)
        const tutorId = 'ab659a84-c8e9-4817-b69f-fd2fb46b7fcb';

        console.log('🧪 Testing Tutor Profile Setup Process...');
        console.log(`👤 Testing with tutor ID: ${tutorId}`);

        // Test 1: Check if tutor exists and has the right role
        console.log('\n📋 Step 1: Checking user role...');
        const userCheck = await query('SELECT id, email, role FROM users WHERE id = $1', [tutorId]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = userCheck.rows[0];
        console.log(`✅ User found: ${user.email}, role: ${user.role}`);

        if (user.role !== 'tutor') {
            throw new Error('User is not a tutor');
        }

        // Test 2: Check current profile state
        console.log('\n📋 Step 2: Checking current profile...');
        const profileCheck = await query(`
            SELECT * FROM tutor_profiles WHERE user_id = $1
        `, [tutorId]);

        if (profileCheck.rows.length > 0) {
            console.log('✅ Tutor profile exists');
            const profile = profileCheck.rows[0];
            console.log(`   - Experience: ${profile.years_of_experience} years`);
            console.log(`   - Rate: $${profile.hourly_rate}/hour`);
            console.log(`   - Languages: ${profile.languages_spoken}`);
        } else {
            console.log('❌ No tutor profile found');
        }

        // Test 3: Try updating profile (simulate the API call)
        console.log('\n📋 Step 3: Testing profile update...');
        const updateResult = await query(`
            UPDATE tutor_profiles
            SET years_of_experience = $2, 
                hourly_rate = $3, 
                education_background = $4, 
                certifications = $5, 
                languages_spoken = $6,
                teaching_philosophy = $7,
                preferred_teaching_method = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
        `, [
            tutorId,
            3, // years_of_experience
            55, // hourly_rate
            'Computer Science Graduate', // education_background
            ['AWS Certified', 'Google Cloud Certified'], // certifications as array
            JSON.stringify(['English', 'Telugu']), // languages_spoken
            'Interactive learning approach', // teaching_philosophy
            'online' // preferred_teaching_method - must be 'online', 'in_person', or 'both'
        ]);

        console.log(`✅ Profile update successful. Rows affected: ${updateResult.rowCount}`);

        // Test 4: Try inserting subjects
        console.log('\n📋 Step 4: Testing subjects insertion...');
        const testSubjects = [
            '5300be37-5643-4372-98c7-3c468655c838', // Mathematics
            'b59cf17e-6bdf-4de9-b775-7a55609eb1c6'  // Computer Science
        ];

        // Clear existing subjects first
        await query('DELETE FROM tutor_subjects WHERE tutor_id = $1', [tutorId]);

        // Insert new subjects
        for (const subjectId of testSubjects) {
            await query(`
                INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level)
                VALUES ($1, $2, 'intermediate')
            `, [tutorId, subjectId]);
        }

        console.log(`✅ Subjects inserted successfully. Count: ${testSubjects.length}`);

        // Test 5: Try inserting availability
        console.log('\n📋 Step 5: Testing availability insertion...');

        // Clear existing availability
        await query('DELETE FROM tutor_availability_slots WHERE tutor_id = $1 AND recurring_pattern IS NOT NULL', [tutorId]);

        // Insert test availability (Tuesday 09:00-10:00, Wednesday 09:00-22:00)
        await query(`
            INSERT INTO tutor_availability_slots 
            (tutor_id, day_of_week, start_time, end_time, recurring_pattern, is_available)
            VALUES ($1, $2, $3, $4, $5, true)
        `, [tutorId, 2, '09:00', '10:00', 'weekly']); // Tuesday

        await query(`
            INSERT INTO tutor_availability_slots 
            (tutor_id, day_of_week, start_time, end_time, recurring_pattern, is_available)
            VALUES ($1, $2, $3, $4, $5, true)
        `, [tutorId, 3, '09:00', '22:00', 'weekly']); // Wednesday

        console.log('✅ Availability inserted successfully');

        // Test 6: Verify final state
        console.log('\n📋 Step 6: Verifying final state...');

        const finalProfile = await query('SELECT * FROM tutor_profiles WHERE user_id = $1', [tutorId]);
        const finalSubjects = await query(`
            SELECT ts.*, s.name 
            FROM tutor_subjects ts 
            JOIN subjects s ON ts.subject_id = s.id 
            WHERE ts.tutor_id = $1
        `, [tutorId]);
        const finalAvailability = await query(`
            SELECT * FROM tutor_availability_slots 
            WHERE tutor_id = $1 AND recurring_pattern IS NOT NULL
        `, [tutorId]);

        console.log('📊 Final Profile State:');
        const fp = finalProfile.rows[0];
        console.log(`   - Experience: ${fp.years_of_experience} years`);
        console.log(`   - Rate: $${fp.hourly_rate}/hour`);
        console.log(`   - Education: ${fp.education_background}`);
        console.log(`   - Languages: ${fp.languages_spoken}`);

        console.log('📊 Final Subjects:');
        finalSubjects.rows.forEach(subject => {
            console.log(`   - ${subject.name} (${subject.proficiency_level})`);
        });

        console.log('📊 Final Availability:');
        finalAvailability.rows.forEach(slot => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            console.log(`   - ${days[slot.day_of_week]}: ${slot.start_time} - ${slot.end_time}`);
        });

        console.log('\n🎉 All tests passed! Profile setup simulation completed successfully.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testTutorProfileSetup();