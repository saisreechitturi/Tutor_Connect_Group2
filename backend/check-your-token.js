require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const crypto = require('crypto');

async function checkSpecificToken() {
    try {
        await connectDatabase();

        const yourToken = '5844542961c947dec637326579cae45da7fb7a411b483725d2b9f0df4833c86b';
        const yourTokenHash = crypto.createHash('sha256').update(yourToken).digest('hex');

        console.log('=== CHECKING YOUR SPECIFIC TOKEN ===');
        console.log('Your token:', yourToken);
        console.log('Your token hash:', yourTokenHash.substring(0, 16) + '...');

        // Search for your token
        const result = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE prt.token_hash = $1
        `, [yourTokenHash]);

        if (result.rows.length === 0) {
            console.log('❌ Your token was not found in database');
            console.log('This means it was either:');
            console.log('1. Never created');
            console.log('2. Overwritten by a newer token request');
            console.log('3. Already used');
            console.log('4. Expired and cleaned up');
        } else {
            const token = result.rows[0];
            console.log('✅ Your token found!');
            console.log('User:', token.email);
            console.log('Expires at:', token.expires_at);
            console.log('Used at:', token.used_at || 'Not used');
            console.log('Is expired:', new Date() > new Date(token.expires_at));
        }

        // Show what token is currently active
        console.log('\n=== CURRENT ACTIVE TOKEN ===');
        const activeResult = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE u.email = 'test@example.com'
        `);

        if (activeResult.rows.length > 0) {
            const active = activeResult.rows[0];
            console.log('Current token hash:', active.token_hash.substring(0, 16) + '...');
            console.log('Expires at:', active.expires_at);
            console.log('Is expired:', new Date() > new Date(active.expires_at));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSpecificToken();