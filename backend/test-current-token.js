require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('\n=== Testing Current Token ===');

// Test the token you should have in localStorage
const testToken = localStorage.getItem('token') || 'YOUR_TOKEN_HERE';

try {
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('✅ Token is valid!');
    console.log('User ID from token:', decoded.userId);
    console.log('Role from token:', decoded.role);
    console.log('Token expires:', new Date(decoded.exp * 1000).toLocaleString());
    
    // Test if this would work with the profile endpoint
    console.log('\n=== Profile Endpoint Test ===');
    console.log('Profile URL: /api/profiles/' + decoded.userId);
    console.log('Expected user ID match:', decoded.userId);
    
} catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
        console.log('\n🔧 The token format is invalid. Please use the new token generated earlier:');
        console.log('1. Open browser console on your TutorConnect page');
        console.log('2. Run: localStorage.setItem(\'token\', \'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NzM2N2VhZS0xMjJiLTQ0YzktODkyNi1kZDhjMjgzOWZlMGUiLCJyb2xlIjoidHV0b3IiLCJpYXQiOjE3NjI5ODI2NjksImV4cCI6MTc2NTU3NDY2OX0.nRqRKo_HsFoBy40NKZwyxOi1v1lqqjp08tfRtpu74Ag\');');
        console.log('3. Refresh the page');
    }
}