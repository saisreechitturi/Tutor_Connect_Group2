require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const crypto = require('crypto');

async function checkUserToken() {
    try {
        await connectDatabase();

        const userToken = '08bbf165b03e5c3c73505e48abc52b1af376f9a3b1dfd557291c031af2b0d3f0';
        const userTokenHash = crypto.createHash('sha256').update(userToken).digest('hex');

        console.log('=== CHECKING USER TOKEN FROM WEBSITE ===');
        console.log('Token:', userToken);
        console.log('Token length:', userToken.length);
        console.log('Token format valid:', /^[a-f0-9]+$/.test(userToken));
        console.log('Token hash:', userTokenHash.substring(0, 16) + '...');

        // Search for this specific token
        const result = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE prt.token_hash = $1
        `, [userTokenHash]);

        if (result.rows.length === 0) {
            console.log('❌ Token not found in database');
        } else {
            const token = result.rows[0];
            console.log('✅ Token found!');
            console.log('User:', token.email);
            console.log('Expires at:', token.expires_at);
            console.log('Used at:', token.used_at || 'Not used');
            console.log('Is expired:', new Date() > new Date(token.expires_at));
            console.log('Is valid for reset:', !token.used_at && new Date() <= new Date(token.expires_at));
        }

        // Show current active token
        console.log('\n=== CURRENT DATABASE STATE ===');
        const allTokens = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            ORDER BY prt.created_at DESC
        `);

        allTokens.rows.forEach((row, index) => {
            console.log(`Token ${index + 1}:`);
            console.log('  User:', row.email);
            console.log('  Hash:', row.token_hash.substring(0, 16) + '...');
            console.log('  Expires:', row.expires_at);
            console.log('  Used:', row.used_at || 'Not used');
            console.log('  Expired:', new Date() > new Date(row.expires_at));
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserToken();