import apiClient from './apiClient';

class ProfileService {
    // Get composite profile by user ID
    async getByUserId(userId) {
        return apiClient.get(`/profiles/${userId}`);
    }

    // Update base user profile fields
    async updateUser(userId, payload) {
        return apiClient.put(`/profiles/${userId}`, payload);
    }

    // Update student-specific profile fields
    async updateStudent(userId, payload) {
        return apiClient.put(`/profiles/${userId}/student`, payload);
    }

    // Update tutor-specific profile fields (not used here but provided for completeness)
    async updateTutor(userId, payload) {
        return apiClient.put(`/profiles/${userId}/tutor`, payload);
    }

    // Update address
    async updateAddress(userId, payload) {
        return apiClient.put(`/profiles/${userId}/address`, payload);
    }
}

const profileService = new ProfileService();
export default profileService;
