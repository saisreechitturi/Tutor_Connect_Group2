const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'demo';
    const hash = await bcrypt.hash(password, 10);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('\nUse this hash in your SQL INSERT statements.');
    process.exit();
}

generateHash();