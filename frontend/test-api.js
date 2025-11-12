// Debug script to test the exact API call
const testAPI = async () => {
    const token = localStorage.getItem('token');

    // Test data that matches what the frontend is sending
    const testData = {
        yearsOfExperience: 2,
        hourlyRate: 44,
        educationBackground: "Test Education",
        certifications: [],
        languagesSpoken: ["English", "esf"],
        teachingPhilosophy: "",
        preferredTeachingMethod: "online"
    };

    console.log('🧪 Testing API call...');
    console.log('📝 Data:', testData);
    console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

    try {
        const response = await fetch('/api/profiles/tutor', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success:', data);
        } else {
            const errorData = await response.text();
            console.log('❌ Error response:', errorData);
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
};

testAPI();