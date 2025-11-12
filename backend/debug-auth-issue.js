require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query, connectDatabase } = require('./src/database/connection');

async function debugAuthenticationIssue() {
    try {
        await connectDatabase();

        console.log('🔍 Debugging Authentication Issue...\n');

        // Test user ID from your token
        const testUserId = 'bbcaed55-370e-45e7-a516-6fefaf0c0b7d';

        console.log(`📋 Testing with User ID: ${testUserId}`);
        console.log(`📋 User ID type: ${typeof testUserId}`);
        console.log(`📋 User ID length: ${testUserId.length}`);

        // 1. Check if user exists in users table
        console.log('\n👤 Step 1: Checking user existence...');
        const userCheck = await query('SELECT id, email, role, is_active FROM users WHERE id = $1', [testUserId]);

        if (userCheck.rows.length === 0) {
            console.log('❌ User not found in users table!');

            // List all users to see the actual IDs
            console.log('\n📋 All users in database:');
            const allUsers = await query('SELECT id, email, role FROM users LIMIT 10');
            allUsers.rows.forEach(user => {
                console.log(`  - ${user.email}: ${user.id} (${user.role})`);
            });
        } else {
            const user = userCheck.rows[0];
            console.log('✅ User found:', {
                id: user.id,
                email: user.email,
                role: user.role,
                is_active: user.is_active
            });

            // 2. Check tutor profile
            console.log('\n🎓 Step 2: Checking tutor profile...');
            const tutorProfile = await query('SELECT * FROM tutor_profiles WHERE user_id = $1', [testUserId]);

            if (tutorProfile.rows.length === 0) {
                console.log('❌ No tutor profile found!');
            } else {
                console.log('✅ Tutor profile found:', {
                    hourly_rate: tutorProfile.rows[0].hourly_rate,
                    years_of_experience: tutorProfile.rows[0].years_of_experience,
                    education_background: tutorProfile.rows[0].education_background
                });
            }

            // 3. Test the exact authentication middleware logic
            console.log('\n🔐 Step 3: Testing authentication middleware logic...');
            const authResult = await query(
                'SELECT id, email, role, is_active FROM users WHERE id = $1 AND is_active = $2',
                [testUserId, true]
            );

            if (authResult.rows.length === 0) {
                console.log('❌ Auth middleware query failed!');
            } else {
                console.log('✅ Auth middleware query successful:', {
                    id: authResult.rows[0].id,
                    email: authResult.rows[0].email,
                    role: authResult.rows[0].role,
                    is_active: authResult.rows[0].is_active
                });

                // 4. Test the tutor profile update logic
                console.log('\n📝 Step 4: Testing tutor profile update logic...');

                // Test role check
                const roleCheck = await query('SELECT role FROM users WHERE id = $1', [testUserId]);
                if (roleCheck.rows.length === 0) {
                    console.log('❌ Role check failed - user not found');
                } else if (roleCheck.rows[0].role !== 'tutor') {
                    console.log(`❌ Role check failed - role is '${roleCheck.rows[0].role}', not 'tutor'`);
                } else {
                    console.log('✅ Role check passed - user is tutor');

                    // Test profile existence check
                    const profileExistCheck = await query('SELECT id FROM tutor_profiles WHERE user_id = $1', [testUserId]);
                    if (profileExistCheck.rows.length === 0) {
                        console.log('❌ Profile existence check failed - creating profile...');

                        // Create profile
                        await query(`
                            INSERT INTO tutor_profiles (user_id, hourly_rate, years_of_experience)
                            VALUES ($1, 0.00, 0)
                            ON CONFLICT (user_id) DO NOTHING
                        `, [testUserId]);

                        console.log('✅ Profile created');
                    } else {
                        console.log('✅ Profile exists');
                    }

                    // Test a simple update
                    console.log('\n🔄 Step 5: Testing profile update...');
                    try {
                        const updateResult = await query(`
                            UPDATE tutor_profiles
                            SET hourly_rate = $2, updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = $1
                            RETURNING user_id, hourly_rate
                        `, [testUserId, 25.00]);

                        if (updateResult.rows.length > 0) {
                            console.log('✅ Profile update successful:', updateResult.rows[0]);
                        } else {
                            console.log('❌ Profile update failed - no rows affected');
                        }
                    } catch (updateError) {
                        console.log('❌ Profile update error:', updateError.message);
                    }
                }
            }

            // 5. Check for any data type issues
            console.log('\n🔍 Step 6: Checking data types...');
            const typeCheck = await query(`
                SELECT 
                    pg_typeof(id) as id_type,
                    pg_typeof(is_active) as is_active_type
                FROM users 
                WHERE id = $1
            `, [testUserId]);

            if (typeCheck.rows.length > 0) {
                console.log('📊 Data types:', typeCheck.rows[0]);
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        process.exit(0);
    }
}

debugAuthenticationIssue();