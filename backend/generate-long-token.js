require('dotenv').config();
const jwt = require('jsonwebtoken');

// Generate a new long-lasting token for user abhinaykotla@gmail.com
const userId = '87367eae-122b-44c9-8926-dd8c2839fe0e';
const email = 'abhinaykotla@gmail.com';
const role = 'tutor';

console.log('\n=== Generating Long-Lasting JWT Token ===');
console.log(`User: ${email}`);
console.log(`User ID: ${userId}`);
console.log(`Role: ${role}`);

// Generate token with new 30-day expiration
const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
);

// Verify the token to show expiration date
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expirationDate = new Date(decoded.exp * 1000);

    console.log(`\n✅ TOKEN GENERATED SUCCESSFULLY:`);
    console.log(`🔑 Token: ${token}`);
    console.log(`⏰ Expires: ${expirationDate.toLocaleString()} (30 days from now)`);
    console.log(`🆔 User ID: ${decoded.userId}`);
    console.log(`👤 Role: ${decoded.role}`);

    console.log('\n🔧 TO FIX YOUR LOGIN ISSUE:');
    console.log('1. Open your browser\'s developer console (F12)');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Click on "Local Storage" for localhost:3000');
    console.log('4. Find the "token" or "authToken" key');
    console.log('5. Replace its value with the token above');
    console.log('6. Refresh the page');

    console.log('\nOr run this command in the browser console:');
    console.log(`localStorage.setItem('token', '${token}');`);

} catch (error) {
    console.error('❌ Error verifying token:', error.message);
}