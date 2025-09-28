const bcrypt = require('bcrypt');
const { connectDatabase, query } = require('./connection');

const addDemoAccounts = async () => {
    try {
        // Initialize database connection
        await connectDatabase();
        
        // Hash the password "demo" for all accounts
        const hashedPassword = await bcrypt.hash('demo', 10);

        // Demo accounts to insert
        const demoAccounts = [
            {
                email: 'student@demo.com',
                password: hashedPassword,
                first_name: 'Demo',
                last_name: 'Student',
                role: 'student',
                profile_picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
            },
            {
                email: 'tutor@demo.com',
                password: hashedPassword,
                first_name: 'Demo',
                last_name: 'Tutor',
                role: 'tutor',
                profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            },
            {
                email: 'admin@demo.com',
                password: hashedPassword,
                first_name: 'Demo',
                last_name: 'Admin',
                role: 'admin',
                profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
            }
        ];

        console.log('🚀 Adding demo accounts to database...');

        for (const account of demoAccounts) {
            try {
                // Check if user already exists
                const existingUser = await query(
                    'SELECT id FROM users WHERE email = $1',
                    [account.email]
                );

                if (existingUser.rows.length > 0) {
                    console.log(`⚠️  User ${account.email} already exists, skipping...`);
                    continue;
                }

                // Insert new user
                const result = await query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role, profile_picture, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
                     RETURNING id, email, role`,
                    [account.email, account.password, account.first_name, account.last_name, account.role, account.profile_picture]
                );

                console.log(`✅ Created ${account.role}: ${result.rows[0].email} (ID: ${result.rows[0].id})`);

                // If it's a tutor, add tutor profile
                if (account.role === 'tutor') {
                    await query(
                        `INSERT INTO tutor_profiles (user_id, subjects, hourly_rate, bio, experience_years, rating, total_sessions, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                        [
                            result.rows[0].id,
                            JSON.stringify(['Mathematics', 'Computer Science']),
                            25.00,
                            'Demo tutor account for testing the TutorConnect platform.',
                            3,
                            4.5,
                            12
                        ]
                    );
                    console.log(`📚 Added tutor profile for ${account.email}`);
                }

            } catch (err) {
                console.error(`❌ Error creating ${account.email}:`, err.message);
            }
        }

        console.log('\n🎉 Demo accounts setup complete!');
        console.log('\n📝 Demo Login Credentials:');
        console.log('👨‍🎓 Student: student@demo.com / demo');
        console.log('👨‍🏫 Tutor: tutor@demo.com / demo');
        console.log('👨‍💼 Admin: admin@demo.com / demo');
        console.log('\n🌐 Test at: http://localhost:3000/Tutor_Connect_Group2');

    } catch (error) {
        console.error('❌ Error setting up demo accounts:', error);
    } finally {
        process.exit();
    }
};

// Run if called directly
if (require.main === module) {
    addDemoAccounts();
}

module.exports = addDemoAccounts;