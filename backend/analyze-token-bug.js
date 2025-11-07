require('dotenv').config();
const { query, connectDatabase } = require('./src/database/connection');
const crypto = require('crypto');

async function analyzeTokenIssue() {
    try {
        await connectDatabase();

        console.log('=== ANALYZING TOKEN STORAGE ISSUE ===');

        // Get the current token from database
        const dbResult = await query(`
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id 
            WHERE u.email = 'abhinaykotla@gmail.com'
        `);

        if (dbResult.rows.length === 0) {
            console.log('No token found for user');
            process.exit(1);
        }

        const dbToken = dbResult.rows[0];
        console.log('Database token hash:', dbToken.token_hash);
        console.log('Database hash length:', dbToken.token_hash.length);

        // Your token from URL
        const yourToken = '08bbf165b03e5c3c73505e48abc52b1af376f9a3b1dfd557291c031af2b0d3f0';
        console.log('\nYour token from URL:', yourToken);
        console.log('Your token length:', yourToken.length);

        // Calculate what the hash should be
        const expectedHash = crypto.createHash('sha256').update(yourToken).digest('hex');
        console.log('\nExpected hash (SHA-256 of your token):', expectedHash);
        console.log('Expected hash length:', expectedHash.length);

        // Compare
        console.log('\n=== COMPARISON ===');
        console.log('Token from URL matches DB hash?', yourToken === dbToken.token_hash);
        console.log('Expected hash matches DB hash?', expectedHash === dbToken.token_hash);

        // If your token matches the DB hash exactly, that means the bug is:
        // The system is storing the raw token instead of the hash!
        if (yourToken === dbToken.token_hash) {
            console.log('\n🐛 BUG FOUND: Raw token is being stored instead of hash!');
            console.log('The forgot-password endpoint is storing the token directly instead of hashing it.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

analyzeTokenIssue();