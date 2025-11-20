import apiClient from './apiClient';

const userService = {
    // Search users by name or email
    search: async (query, limit = 20) => {
        try {
            const res = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
            // Normalize to array of simple user objects
            const users = res.users || [];
            return users.map(u => ({
                id: u.id,
                firstName: u.firstName || u.first_name,
                lastName: u.lastName || u.last_name,
                name: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
                role: u.role,
                email: u.email,
                profileImageUrl: u.avatarUrl || u.profile_picture_url
            }));
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },
    // Get user profile
    getProfile: async (userId) => {
        try {
            const response = await apiClient.get(`/users/${userId}`);
            return response; // apiClient already returns the data, not response.data
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        try {
            const response = await apiClient.put(`/users/${userId}`, profileData);
            return response; // apiClient already returns the data, not response.data
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },



    // Change password
    changePassword: async (passwordData) => {
        try {
            const response = await apiClient.put(`/auth/password`, passwordData);
            return response.data;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
};

export default userService;