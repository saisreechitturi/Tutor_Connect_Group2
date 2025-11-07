require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const crypto = require('crypto');

async function generateAndShowToken() {
    try {
        await connectDatabase();
        console.log('=== GENERATING NEW RESET TOKEN ===');

        // Check if user exists
        const userResult = await query(
            'SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = true',
            ['abhinaykotla@gmail.com']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User abhinaykotla@gmail.com not found or not active');
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

        // Generate new reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        console.log('\n=== TOKEN DETAILS ===');
        console.log('Raw Token:', resetToken);
        console.log('Token Length:', resetToken.length);
        console.log('Token Hash:', resetTokenHash);
        console.log('Expires At:', expiresAt.toISOString());

        // Store in database
        await query(`
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET
                token_hash = EXCLUDED.token_hash,
                expires_at = EXCLUDED.expires_at,
                used_at = NULL,
                created_at = NOW()
        `, [user.id, resetTokenHash, expiresAt]);

        console.log('✅ Token stored in database');

        const resetUrl = `http://localhost:3000/#/reset-password/${resetToken}`;
        console.log('\n=== RESET URL ===');
        console.log(resetUrl);

        console.log('\n=== TEST COMMAND ===');
        console.log(`Invoke-WebRequest -Uri "http://localhost:5000/api/auth/reset-password" -Method POST -ContentType "application/json" -Body '{"token":"${resetToken}","password":"NewPassword123"}'`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

generateAndShowToken();