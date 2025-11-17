const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBookingFlowAPIs() {
    console.log('🧪 Testing TutorConnect Booking Flow APIs\n');

    try {
        // Test 1: Get all tutors
        console.log('1. Testing GET /tutors...');
        const tutorsResponse = await axios.get(`${BASE_URL}/tutors`);
        console.log(`   ✅ Found ${tutorsResponse.data.tutors?.length || 0} tutors`);

        if (tutorsResponse.data.tutors && tutorsResponse.data.tutors.length > 0) {
            const firstTutor = tutorsResponse.data.tutors[0];
            console.log(`   📋 Sample tutor: ${firstTutor.firstName} ${firstTutor.lastName} - $${firstTutor.hourlyRate}/hr`);

            // Test 2: Get tutor details
            console.log('\n2. Testing GET /tutors/:id/details...');
            try {
                const tutorDetailsResponse = await axios.get(`${BASE_URL}/tutors/${firstTutor.id}/details`);
                console.log(`   ✅ Tutor details loaded`);
                console.log(`   📋 Subjects: ${tutorDetailsResponse.data.subjects?.length || 0}`);
                console.log(`   📋 Availability slots: ${tutorDetailsResponse.data.availability?.length || 0}`);

                // Test 3: Get availability slots for a specific date
                console.log('\n3. Testing GET /availability/:tutorId/slots...');
                const today = new Date().toISOString().split('T')[0];
                try {
                    const slotsResponse = await axios.get(`${BASE_URL}/availability/${firstTutor.id}/slots?date=${today}`);
                    console.log(`   ✅ Availability slots for ${today}: ${slotsResponse.data.slots?.length || 0}`);
                } catch (err) {
                    console.log(`   ⚠️  Availability slots endpoint: ${err.response?.status} ${err.response?.statusText}`);
                }

                // Test 4: Test subjects endpoint
                console.log('\n4. Testing GET /subjects...');
                try {
                    const subjectsResponse = await axios.get(`${BASE_URL}/subjects`);
                    console.log(`   ✅ Found ${subjectsResponse.data.subjects?.length || 0} subjects`);
                } catch (err) {
                    console.log(`   ⚠️  Subjects endpoint: ${err.response?.status} ${err.response?.statusText}`);
                }

                // Test 5: Test session creation (this would require authentication in real scenario)
                console.log('\n5. Testing POST /sessions (booking endpoint)...');
                try {
                    const sessionData = {
                        tutorId: firstTutor.id,
                        title: 'Test Session',
                        description: 'Test booking flow',
                        subjectId: tutorDetailsResponse.data.subjects?.[0]?.id,
                        sessionType: 'online',
                        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
                        hourlyRate: firstTutor.hourlyRate
                    };

                    // This will likely fail without authentication, but we can test the endpoint exists
                    await axios.post(`${BASE_URL}/sessions`, sessionData);
                    console.log(`   ✅ Session creation endpoint accessible`);
                } catch (err) {
                    if (err.response?.status === 401) {
                        console.log(`   ⚠️  Session creation requires authentication (expected)`);
                    } else {
                        console.log(`   ⚠️  Session creation endpoint: ${err.response?.status} ${err.response?.statusText}`);
                    }
                }

            } catch (err) {
                console.log(`   ❌ Tutor details failed: ${err.response?.status} ${err.response?.statusText}`);
            }
        }

        console.log('\n🎉 API Testing Complete!');

    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
        console.error('Full error:', error);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
        }
    }
}

testBookingFlowAPIs();