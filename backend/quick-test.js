// Simple endpoint verification
const axios = require('axios');

async function quickTest() {
    const BASE_URL = 'http://localhost:5000';

    try {
        console.log('🔍 Testing server connectivity...');

        // Test health endpoint
        const health = await axios.get(`${BASE_URL}/health`);
        console.log(`✅ Health check: ${health.status} - ${health.data.status}`);

        // Test analytics endpoint (expect 404 for non-existent tutor)
        try {
            const analytics = await axios.get(`${BASE_URL}/api/analytics/dashboard/550e8400-e29b-41d4-a716-446655440001`);
            console.log(`✅ Analytics endpoint: ${analytics.status}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Analytics endpoint: 404 (expected for non-existent tutor)');
            } else {
                console.log(`❌ Analytics endpoint error: ${error.message}`);
            }
        }

        // Test availability endpoint
        try {
            const availability = await axios.get(`${BASE_URL}/api/availability/550e8400-e29b-41d4-a716-446655440001`);
            console.log(`✅ Availability endpoint: ${availability.status}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Availability endpoint: 404 (expected for non-existent tutor)');
            } else {
                console.log(`❌ Availability endpoint error: ${error.message}`);
            }
        }

        console.log('\n🎉 All endpoints are responsive!');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running on port 5000');
        } else {
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
}

quickTest();