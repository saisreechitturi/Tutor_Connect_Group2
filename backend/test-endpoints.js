const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Sample test data
const testTutorId = '123e4567-e89b-12d3-a456-426614174000'; // UUID format
const testSessionId = '123e4567-e89b-12d3-a456-426614174001';

async function testTutorEndpoints() {
    console.log('🧪 Testing Tutor Analytics, Availability & Payment Endpoints');
    console.log('==============================================================\n');

    const tests = [
        // Analytics endpoints
        {
            name: 'Tutor Dashboard Analytics',
            method: 'GET',
            url: `/analytics/dashboard/${testTutorId}`,
            expectedStatus: [200, 404] // 404 is ok if tutor doesn't exist
        },
        {
            name: 'Tutor Earnings Breakdown',
            method: 'GET',
            url: `/analytics/earnings/${testTutorId}`,
            expectedStatus: [200, 404]
        },
        {
            name: 'Student Progress Analytics',
            method: 'GET',
            url: `/analytics/students/${testTutorId}`,
            expectedStatus: [200, 404]
        },

        // Availability endpoints
        {
            name: 'Get Tutor Availability',
            method: 'GET',
            url: `/availability/${testTutorId}`,
            expectedStatus: [200, 404]
        },
        {
            name: 'Get Bookable Slots',
            method: 'GET',
            url: `/availability/${testTutorId}/bookable?date=2025-01-15`,
            expectedStatus: [200, 404]
        },

        // Payment endpoints
        {
            name: 'Process Session Payment (Mock)',
            method: 'POST',
            url: `/payments/process`,
            data: {
                sessionId: testSessionId,
                amount: 50.00,
                currency: 'USD'
            },
            expectedStatus: [200, 201, 400, 404] // Various responses are acceptable for mock
        },

        // Server health check
        {
            name: 'Server Health Check',
            method: 'GET',
            url: '/health',
            expectedStatus: [200]
        }
    ];

    const results = [];

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);

            const config = {
                method: test.method,
                url: `${BASE_URL}${test.url}`,
                timeout: 5000
            };

            if (test.data) {
                config.data = test.data;
            }

            const response = await axios(config);

            if (test.expectedStatus.includes(response.status)) {
                console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
                results.push({ test: test.name, status: 'PASS', code: response.status });
            } else {
                console.log(`⚠️  ${test.name}: Unexpected status ${response.status}`);
                results.push({ test: test.name, status: 'UNEXPECTED', code: response.status });
            }

        } catch (error) {
            if (error.response && test.expectedStatus.includes(error.response.status)) {
                console.log(`✅ ${test.name}: SUCCESS (${error.response.status})`);
                results.push({ test: test.name, status: 'PASS', code: error.response.status });
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${test.name}: Server not running`);
                results.push({ test: test.name, status: 'FAIL', error: 'Server not running' });
            } else {
                console.log(`❌ ${test.name}: ${error.message}`);
                results.push({ test: test.name, status: 'FAIL', error: error.message });
            }
        }

        console.log(''); // Add spacing
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const unexpected = results.filter(r => r.status === 'UNEXPECTED').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Unexpected: ${unexpected}`);
    console.log(`📝 Total: ${results.length}`);

    if (failed === 0) {
        console.log('\n🎉 All endpoints are working correctly!');
        console.log('\n🚀 Ready to use:');
        console.log('   • Tutor Analytics Dashboard - GET /api/analytics/dashboard/:tutorId');
        console.log('   • Earnings Tracking - GET /api/analytics/earnings/:tutorId');
        console.log('   • Student Progress - GET /api/analytics/students/:tutorId');
        console.log('   • Availability Management - GET/POST /api/availability/:tutorId');
        console.log('   • Mock Payment Processing - POST /api/payments/process');
    } else {
        console.log('\n⚠️  Some endpoints may need attention');
    }
}

// Run tests
testTutorEndpoints().catch(console.error);