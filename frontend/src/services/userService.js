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
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        try {
            const response = await apiClient.put(`/users/${userId}`, profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    // Update user preferences (notifications, privacy, etc.)
    updatePreferences: async (userId, preferences) => {
        try {
            // For now, we'll store preferences in localStorage since there's no backend endpoint
            // In a real app, this would be a proper API endpoint
            const key = `userPreferences_${userId}`;
            localStorage.setItem(key, JSON.stringify(preferences));
            return { message: 'Preferences updated successfully' };
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    },

    // Get user preferences
    getPreferences: async (userId) => {
        try {
            const key = `userPreferences_${userId}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                return JSON.parse(stored);
            }
            return {
                notifications: {
                    emailNotifications: true,
                    pushNotifications: true,
                    sessionReminders: true,
                    weeklyDigest: false,
                    promotionalEmails: false
                },
                privacy: {
                    profileVisibility: 'public',
                    showEmail: false,
                    showPhone: false,
                    allowMessages: true
                }
            };
        } catch (error) {
            console.error('Error fetching user preferences:', error);
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