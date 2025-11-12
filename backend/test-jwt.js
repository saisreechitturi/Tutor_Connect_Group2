require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test the JWT secret and token decoding
const testToken = () => {
    // Replace this with the actual token from your browser (first 50 chars from console)
    const tokenFromBrowser = 'YOUR_TOKEN_HERE'; // You'll need to copy this from browser console

    console.log('🔍 Testing JWT Authentication...\n');
    console.log('🔑 JWT_SECRET from env:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET);

    if (tokenFromBrowser !== 'YOUR_TOKEN_HERE') {
        try {
            console.log('\n📋 Testing token decoding...');
            const decoded = jwt.verify(tokenFromBrowser, process.env.JWT_SECRET);
            console.log('✅ Token decoded successfully:', decoded);
        } catch (error) {
            console.log('❌ Token verification failed:', error.message);
        }
    } else {
        console.log('\n⚠️ Please replace YOUR_TOKEN_HERE with actual token from browser console');
    }
};

testToken();