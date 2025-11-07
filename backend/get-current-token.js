require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');

async function getCurrentToken() {
    try {
        await connectDatabase();

        const result = await query(`
            SELECT prt.token_hash, prt.expires_at
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE u.email = 'abhinaykotla@gmail.com'
            AND prt.expires_at > NOW()
            AND prt.used_at IS NULL
        `);

        if (result.rows.length === 0) {
            console.log('No valid token found');
        } else {
            const token = result.rows[0];
            console.log('=== CURRENT VALID TOKEN ===');
            console.log('Token:', token.token_hash);
            console.log('Length:', token.token_hash.length);
            console.log('Expires:', token.expires_at);
            console.log('\n=== RESET URL ===');
            console.log(`http://localhost:3000/#/reset-password/${token.token_hash}`);
            console.log('\n=== TEST COMMAND ===');
            console.log(`Invoke-WebRequest -Uri "http://localhost:5000/api/auth/reset-password" -Method POST -ContentType "application/json" -Body '{"token":"${token.token_hash}","password":"Test1234"}'`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getCurrentToken();