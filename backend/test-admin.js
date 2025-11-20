// Test admin login
const testAdminLogin = async () => {
    const loginData = {
        email: 'admin@demo.com',
        password: 'Demo1234'
    };

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Admin login successful!');
            console.log('User:', result.user);
            console.log('Token length:', result.token.length);

            // Test getting admin stats
            const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${result.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('✅ Admin stats endpoint works!');
                console.log('Stats:', statsData);
            } else {
                console.log('❌ Admin stats failed:', await statsResponse.text());
            }

        } else {
            console.log('❌ Admin login failed:', result);
        }
    } catch (error) {
        console.error('❌ Error testing admin login:', error);
    }
};

testAdminLogin();