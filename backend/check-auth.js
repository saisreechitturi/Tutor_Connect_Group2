const jwt = require('jsonwebtoken');
const { query, connectDatabase } = require('./src/database/connection');

async function checkAuthentication() {
    try {
        await connectDatabase();

        console.log('🔍 Checking authentication status...');

        // Check JWT secret
        const jwtSecret = process.env.JWT_SECRET;
        console.log('JWT Secret exists:', !!jwtSecret);
        console.log('JWT Secret length:', jwtSecret ? jwtSecret.length : 'N/A');

        // Get all users to see who we can generate tokens for
        const users = await query(`
            SELECT id, email, first_name, last_name, role, is_active, created_at
            FROM users 
            WHERE role = 'tutor' AND is_active = true
            ORDER BY created_at DESC
        `);

        console.log('\n👥 Available tutor users:');
        users.rows.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
            console.log(`     ID: ${user.id}`);
            console.log(`     Role: ${user.role}`);
            console.log('');
        });

        if (users.rows.length > 0) {
            // Generate a new token for the first tutor
            const firstTutor = users.rows[0];
            const tokenPayload = {
                userId: firstTutor.id,
                email: firstTutor.email,
                role: firstTutor.role
            };

            const newToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

            console.log('🎯 Generated new test token for:', firstTutor.email);
            console.log('📝 Token:', newToken);
            console.log('📝 Token length:', newToken.length);

            // Verify the token works
            try {
                const decoded = jwt.verify(newToken, jwtSecret);
                console.log('✅ Token verification successful');
                console.log('📋 Decoded payload:', {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    exp: new Date(decoded.exp * 1000).toLocaleString()
                });
            } catch (verifyError) {
                console.error('❌ Token verification failed:', verifyError.message);
            }

            console.log('\n📋 Instructions:');
            console.log('1. Copy the token above');
            console.log('2. Open browser developer tools');
            console.log('3. In console, run: localStorage.setItem("token", "TOKEN_HERE")');
            console.log('4. Refresh the page and try the profile setup again');
        }

    } catch (error) {
        console.error('❌ Authentication check failed:', error);
    } finally {
        process.exit(0);
    }
}

checkAuthentication();