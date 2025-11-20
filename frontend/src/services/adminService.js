import apiClient from './apiClient';

class AdminService {
    // Get all users (admin only)
    async getAllUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.role) queryParams.append('role', filters.role);
            if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive);
            if (filters.isVerified !== undefined) queryParams.append('isVerified', filters.isVerified);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
            if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response;
        } catch (error) {
            console.error('[AdminService] Get all users failed:', error);
            throw error;
        }
    }

    // Get user by ID (admin only)
    async getUserById(userId) {
        try {
            const response = await apiClient.get(`/admin/users/${userId}`);
            return response.user || response;
        } catch (error) {
            console.error('[AdminService] Get user by ID failed:', error);
            throw error;
        }
    }

    // Update user (admin only)
    async updateUser(userId, updateData) {
        try {
            const response = await apiClient.put(`/admin/users/${userId}`, updateData);
            return response;
        } catch (error) {
            console.error('[AdminService] Update user failed:', error);
            throw error;
        }
    }

    // Activate/Deactivate user (admin only)
    async toggleUserStatus(userId, status) {
        try {
            console.log(`[AdminService] Updating user status:`, { userId, status });
            const response = await apiClient.patch(`/admin/users/${userId}/status`, {
                status: status
            });
            console.log(`[AdminService] Status update successful:`, response);
            return response;
        } catch (error) {
            console.error('[AdminService] Toggle user status failed:', {
                error: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: `/admin/users/${userId}/status`,
                requestData: { status }
            });
            throw error;
        }
    }

    // Verify/Unverify user (admin only)
    async toggleUserVerification(userId, isVerified) {
        try {
            const response = await apiClient.put(`/admin/users/${userId}/verification`, {
                isVerified
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Toggle user verification failed:', error);
        }
    }

    // Update tutor verification status (admin only)
    async updateTutorVerification(userId, isVerified) {
        try {
            console.log(`[AdminService] Updating tutor verification:`, { userId, isVerified });
            const response = await apiClient.patch(`/admin/tutors/${userId}/verification`, {
                isVerified
            });
            console.log(`[AdminService] Tutor verification update successful:`, response);
            return response;
        } catch (error) {
            console.error('[AdminService] Update tutor verification failed:', {
                error: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: `/admin/tutors/${userId}/verification`,
                requestData: { isVerified }
            });
            throw error;
        }
    }

    // Get all sessions (admin only)
    async getAllSessions(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.tutorId) queryParams.append('tutorId', filters.tutorId);
            if (filters.studentId) queryParams.append('studentId', filters.studentId);
            if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
            if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
            if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const endpoint = `/admin/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response;
        } catch (error) {
            console.error('[AdminService] Get all sessions failed:', error);
            throw error;
        }
    }

    // Get session by ID (admin only)
    async getSessionById(sessionId) {
        try {
            const response = await apiClient.get(`/admin/sessions/${sessionId}`);
            return response.session || response;
        } catch (error) {
            console.error('[AdminService] Get session by ID failed:', error);
            throw error;
        }
    }

    // Cancel session (admin only)
    async cancelSession(sessionId, reason) {
        try {
            const response = await apiClient.put(`/admin/sessions/${sessionId}/cancel`, {
                cancellationReason: reason
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Cancel session failed:', error);
            throw error;
        }
    }

    // Get platform analytics
    async getAnalytics(timeframe = '30d') {
        try {
            const response = await apiClient.get(`/admin/analytics?timeframe=${timeframe}`);
            return response.analytics || response;
        } catch (error) {
            console.error('[AdminService] Get analytics failed:', error);
            throw error;
        }
    }

    // Get user statistics
    async getUserStats() {
        try {
            const response = await apiClient.get('/admin/stats/users');
            return response.stats || response;
        } catch (error) {
            console.error('[AdminService] Get user stats failed:', error);
            throw error;
        }
    }

    // Get session statistics
    async getSessionStats() {
        try {
            const response = await apiClient.get('/admin/stats/sessions');
            return response.stats || response;
        } catch (error) {
            console.error('[AdminService] Get session stats failed:', error);
            throw error;
        }
    }

    // Get financial statistics
    async getFinancialStats() {
        try {
            const response = await apiClient.get('/admin/stats/financial');
            return response.stats || response;
        } catch (error) {
            console.error('[AdminService] Get financial stats failed:', error);
            throw error;
        }
    }

    // Get all subjects (admin only - with admin data)
    async getAllSubjects() {
        try {
            const response = await apiClient.get('/admin/subjects');
            return response.subjects || response;
        } catch (error) {
            console.error('[AdminService] Get all subjects failed:', error);
            throw error;
        }
    }

    // Create subject (admin only)
    async createSubject(subjectData) {
        try {
            const response = await apiClient.post('/admin/subjects', subjectData);
            return response;
        } catch (error) {
            console.error('[AdminService] Create subject failed:', error);
            throw error;
        }
    }

    // Update subject (admin only)
    async updateSubject(subjectId, subjectData) {
        try {
            const response = await apiClient.put(`/admin/subjects/${subjectId}`, subjectData);
            return response;
        } catch (error) {
            console.error('[AdminService] Update subject failed:', error);
            throw error;
        }
    }

    // Delete subject (admin only)
    async deleteSubject(subjectId) {
        try {
            const response = await apiClient.delete(`/admin/subjects/${subjectId}`);
            return response;
        } catch (error) {
            console.error('[AdminService] Delete subject failed:', error);
            throw error;
        }
    }

    // Get platform settings
    async getPlatformSettings() {
        try {
            const response = await apiClient.get('/admin/settings');
            return response.settings || response;
        } catch (error) {
            console.error('[AdminService] Get platform settings failed:', error);
            throw error;
        }
    }

    // Update platform settings
    async updatePlatformSettings(settingsData) {
        try {
            const response = await apiClient.put('/admin/settings', settingsData);
            return response;
        } catch (error) {
            console.error('[AdminService] Update platform settings failed:', error);
            throw error;
        }
    }

    // Get all payments (admin only)
    async getAllPayments(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.status) queryParams.append('status', filters.status);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.payerId) queryParams.append('payerId', filters.payerId);
            if (filters.payeeId) queryParams.append('payeeId', filters.payeeId);
            if (filters.sessionId) queryParams.append('sessionId', filters.sessionId);

            const endpoint = `/admin/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response;
        } catch (error) {
            console.error('[AdminService] Get all payments failed:', error);
            throw error;
        }
    }

    // Process refund (admin only)
    async processRefund(paymentId, amount, reason) {
        try {
            const response = await apiClient.post(`/admin/payments/${paymentId}/refund`, {
                amount,
                reason
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Process refund failed:', error);
            throw error;
        }
    }

    // Send notification to users (admin only)
    async sendNotification(notificationData) {
        try {
            const response = await apiClient.post('/admin/notifications', {
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type,
                targetRole: notificationData.targetRole
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Send notification failed:', error);
            throw error;
        }
    }

    // Get all notifications/announcements (admin only)
    async getNotifications(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.type) queryParams.append('type', filters.type);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const endpoint = `/admin/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response;
        } catch (error) {
            console.error('[AdminService] Get notifications failed:', error);
            throw error;
        }
    }

    // Get system logs (admin only)
    async getSystemLogs(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.level) queryParams.append('level', filters.level);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.service) queryParams.append('service', filters.service);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `/admin/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.logs || response;
        } catch (error) {
            console.error('[AdminService] Get system logs failed:', error);
            throw error;
        }
    }

    // Get platform statistics (admin only)
    async getStats() {
        try {
            const response = await apiClient.get('/admin/stats');
            return response;
        } catch (error) {
            console.error('[AdminService] Get stats failed:', error);
            throw error;
        }
    }

    // Get all settings (admin only)
    async getSettings(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (filters.category) queryParams.append('category', filters.category);
            if (filters.key) queryParams.append('key', filters.key);

            const endpoint = `/admin/settings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.settings || response;
        } catch (error) {
            console.error('[AdminService] Get settings failed:', error);
            throw error;
        }
    }

    // Update setting (admin only)
    async updateSetting(key, settingData) {
        try {
            const response = await apiClient.put(`/admin/settings/${key}`, {
                value: settingData.value,
                description: settingData.description
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Update setting failed:', error);
            throw error;
        }
    }

    // Create setting (admin only)
    async createSetting(settingData) {
        try {
            const response = await apiClient.post('/admin/settings', {
                key: settingData.key,
                value: settingData.value,
                category: settingData.category,
                description: settingData.description,
                dataType: settingData.dataType,
                isPublic: settingData.isPublic
            });
            return response;
        } catch (error) {
            console.error('[AdminService] Create setting failed:', error);
            throw error;
        }
    }

    // Delete setting (admin only)
    async deleteSetting(key) {
        try {
            const response = await apiClient.delete(`/admin/settings/${key}`);
            return response;
        } catch (error) {
            console.error('[AdminService] Delete setting failed:', error);
            throw error;
        }
    }

    // Get all reviews (admin only)
    async getAllReviews(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.rating) queryParams.append('rating', filters.rating);
            if (filters.reviewerType) queryParams.append('reviewerType', filters.reviewerType);
            if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const endpoint = `/admin/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response;
        } catch (error) {
            console.error('[AdminService] Get all reviews failed:', error);
            throw error;
        }
    }

    // Delete a review (admin only)
    async deleteReview(reviewId) {
        try {
            const response = await apiClient.delete(`/admin/reviews/${reviewId}`);
            return response;
        } catch (error) {
            console.error('[AdminService] Delete review failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const adminService = new AdminService();
export default adminService;