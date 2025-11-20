const axios = require('axios');

async function testAdminStats() {
    try {
        // First login as admin
        console.log('Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo1234'
        });

        const token = loginResponse.data.token;
        console.log('Admin login successful!');

        // Now test the stats endpoint
        console.log('Fetching admin stats...');
        const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Admin stats response:');
        console.log(JSON.stringify(statsResponse.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testAdminStats();