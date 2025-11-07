const crypto = require('crypto');

// Test the token you provided
const providedToken = '4fd0532acbb6245b604b1e1d3873e9117331b7e1e7809b88357a7fdb34ac78a1';

console.log('=== TOKEN ANALYSIS ===');
console.log('Provided token:', providedToken);
console.log('Token length:', providedToken.length);
console.log('Token format valid:', /^[a-f0-9]+$/.test(providedToken));

// Calculate what the hash should be
const expectedHash = crypto.createHash('sha256').update(providedToken).digest('hex');
console.log('Expected hash:', expectedHash);
console.log('Hash sample:', expectedHash.substring(0, 16) + '...');

// Test with different encodings to see if there's an encoding issue
console.log('\n=== ENCODING TESTS ===');
console.log('UTF-8 hash:', crypto.createHash('sha256').update(providedToken, 'utf8').digest('hex'));
console.log('ASCII hash:', crypto.createHash('sha256').update(providedToken, 'ascii').digest('hex'));
console.log('Buffer hash:', crypto.createHash('sha256').update(Buffer.from(providedToken, 'hex')).digest('hex'));

// Generate a new token to see the format
console.log('\n=== NEW TOKEN GENERATION ===');
const newToken = crypto.randomBytes(32).toString('hex');
const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
console.log('New token:', newToken);
console.log('New token length:', newToken.length);
console.log('New hash:', newHash);