require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NzM2N2VhZS0xMjJiLTQ0YzktODkyNi1kZDhjMjgzOWZlMGUiLCJyb2xlIjoidHV0b3IiLCJpYXQiOjE3NjI5ODI2NjksImV4cCI6MTc2NTU3NDY2OX0.nRqRKo_HsFoBy40NKZwyxOi1v1lqqjp08tfRtpu74Ag';
const userId = '87367eae-122b-44c9-8926-dd8c2839fe0e';

async function testProfileAccess() {
    console.log('\n=== Testing Profile Access ===');
    console.log('API Base:', API_BASE);
    console.log('User ID:', userId);
    console.log('Token length:', token.length);

    try {
        // Test profile GET endpoint
        console.log('\n1. Testing GET /api/profiles/' + userId);
        const getResponse = await fetch(`${API_BASE}/profiles/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('GET Response status:', getResponse.status);
        console.log('GET Response headers:', Object.fromEntries(getResponse.headers));
        
        if (getResponse.ok) {
            const getData = await getResponse.json();
            console.log('✅ GET Profile successful!');
            console.log('Profile data:', JSON.stringify(getData, null, 2));
        } else {
            const errorData = await getResponse.text();
            console.log('❌ GET Profile failed!');
            console.log('Error:', errorData);
        }

        // Test profile PUT endpoint  
        console.log('\n2. Testing PUT /api/profiles/' + userId);
        const putResponse = await fetch(`${API_BASE}/profiles/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User'
            })
        });

        console.log('PUT Response status:', putResponse.status);
        
        if (putResponse.ok) {
            const putData = await putResponse.json();
            console.log('✅ PUT Profile successful!');
            console.log('Update result:', JSON.stringify(putData, null, 2));
        } else {
            const errorData = await putResponse.text();
            console.log('❌ PUT Profile failed!');
            console.log('Error:', errorData);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n🔧 Make sure the backend server is running on port 5000');
    }
}

testProfileAccess();