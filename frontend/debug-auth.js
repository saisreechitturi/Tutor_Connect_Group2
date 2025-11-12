// Add this to your browser console to debug authentication issues

const debugAuth = async () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);

    if (token) {
        console.log('🔍 Token preview:', token.substring(0, 20) + '...');

        try {
            // Try to decode the token (basic decode, won't verify signature)
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('📄 Token payload:', payload);
                console.log('⏰ Token expires:', new Date(payload.exp * 1000));
                console.log('🆔 User ID from token:', payload.userId);
            }
        } catch (e) {
            console.error('❌ Token decode error:', e);
        }

        // Test the profile API
        try {
            console.log('🧪 Testing profile API...');
            const response = await fetch('/api/profiles/tutor', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Profile API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Profile API success:', data);
            } else {
                const errorText = await response.text();
                console.error('❌ Profile API error:', errorText);
            }
        } catch (e) {
            console.error('❌ Profile API request failed:', e);
        }
    } else {
        console.log('❌ No token found');
    }
};

// Run the debug function
debugAuth();