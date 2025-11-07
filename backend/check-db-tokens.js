require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const crypto = require('crypto');

async function checkTokensInDatabase() {
    try {
        // Initialize database connection
        await connectDatabase();
        console.log('=== CHECKING DATABASE TOKENS ===');

        // Get all password reset tokens
        const result = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            ORDER BY prt.created_at DESC 
            LIMIT 5
        `);

        console.log(`Found ${result.rows.length} tokens in database:`);

        result.rows.forEach((row, index) => {
            console.log(`\n--- Token ${index + 1} ---`);
            console.log('User email:', row.email);
            console.log('Token hash:', row.token_hash.substring(0, 16) + '...');
            console.log('Expires at:', row.expires_at);
            console.log('Used at:', row.used_at || 'Not used');
            console.log('Created at:', row.created_at);
            console.log('Is expired:', new Date() > new Date(row.expires_at));
        });

        // Test the specific token hash
        const providedToken = '4fd0532acbb6245b604b1e1d3873e9117331b7e1e7809b88357a7fdb34ac78a1';
        const expectedHash = crypto.createHash('sha256').update(providedToken).digest('hex');

        console.log('\n=== SEARCHING FOR PROVIDED TOKEN ===');
        console.log('Looking for hash:', expectedHash.substring(0, 16) + '...');

        const tokenSearch = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE prt.token_hash = $1
        `, [expectedHash]);

        if (tokenSearch.rows.length === 0) {
            console.log('❌ Token not found in database');
        } else {
            const token = tokenSearch.rows[0];
            console.log('✅ Token found!');
            console.log('User email:', token.email);
            console.log('Expires at:', token.expires_at);
            console.log('Used at:', token.used_at || 'Not used');
            console.log('Is expired:', new Date() > new Date(token.expires_at));
            console.log('User is active:', token.is_active !== false);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking database:', error);
        process.exit(1);
    }
}

checkTokensInDatabase();