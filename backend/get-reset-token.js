require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');

async function getCurrentTokenForUser(email = 'abhinaykotla@gmail.com') {
    try {
        await connectDatabase();

        console.log(`\n🔍 Getting current reset token for: ${email}`);
        console.log('='.repeat(60));

        const result = await query(`
            SELECT prt.token_hash, prt.expires_at, prt.used_at, prt.created_at
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE u.email = $1
            ORDER BY prt.created_at DESC
            LIMIT 1
        `, [email]);

        if (result.rows.length === 0) {
            console.log('❌ No reset token found for this email');
            console.log('\n💡 To generate a new token, run:');
            console.log(`   POST http://localhost:5000/api/auth/forgot-password`);
            console.log(`   Body: {"email":"${email}"}`);
        } else {
            const token = result.rows[0];
            const isExpired = new Date() > new Date(token.expires_at);
            const isUsed = token.used_at !== null;

            console.log('✅ Token found!');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Token: ${token.token_hash}`);
            console.log(`⏰ Created: ${token.created_at}`);
            console.log(`⌛ Expires: ${token.expires_at}`);
            console.log(`✅ Used: ${token.used_at || 'Not used'}`);
            console.log(`🔴 Expired: ${isExpired ? 'Yes' : 'No'}`);
            console.log(`🟢 Valid: ${!isExpired && !isUsed ? 'Yes' : 'No'}`);

            if (!isExpired && !isUsed) {
                console.log('\n🌐 RESET URL:');
                console.log(`http://localhost:3000/#/reset-password/${token.token_hash}`);

                console.log('\n📋 FOR MANUAL ENTRY:');
                console.log(`Token: ${token.token_hash}`);
                console.log(`Length: ${token.token_hash.length} characters`);
            } else if (isExpired) {
                console.log('\n⚠️  This token has expired. Request a new one.');
            } else if (isUsed) {
                console.log('\n⚠️  This token has already been used. Request a new one.');
            }
        }

        console.log('\n' + '='.repeat(60));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'abhinaykotla@gmail.com';
getCurrentTokenForUser(email);