import apiClient from './apiClient';

class TutorService {
    // Get all tutors with optional filters
    async getTutors(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.subject) queryParams.append('subject', filters.subject);
            if (filters.priceRange) {
                if (Array.isArray(filters.priceRange)) {
                    queryParams.append('minRate', filters.priceRange[0]);
                    queryParams.append('maxRate', filters.priceRange[1]);
                }
            }
            if (filters.minRate) queryParams.append('minRate', filters.minRate);
            if (filters.maxRate) queryParams.append('maxRate', filters.maxRate);
            if (filters.rating || filters.minRating) queryParams.append('minRating', filters.rating ?? filters.minRating);
            if (filters.search) queryParams.append('search', filters.search);

            const endpoint = `/tutors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.tutors || response;
        } catch (error) {
            console.error('[TutorService] Get tutors failed:', error);
            throw error;
        }
    }

    // Get tutor by ID
    async getTutorById(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}`);
            return response.tutor || response;
        } catch (error) {
            console.error('[TutorService] Get tutor by ID failed:', error);
            throw error;
        }
    }

    // Get tutor details with subjects and availability
    async getTutorDetails(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/details`);
            return response;
        } catch (error) {
            console.error('[TutorService] Get tutor details failed:', error);
            throw error;
        }
    }

    // Get tutor's subjects
    async getTutorSubjects(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/subjects`);
            return response.subjects || response;
        } catch (error) {
            console.error('[TutorService] Get tutor subjects failed:', error);
            throw error;
        }
    }

    // Get tutor's reviews
    async getTutorReviews(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/reviews`);
            return response.reviews || response;
        } catch (error) {
            console.error('[TutorService] Get tutor reviews failed:', error);
            throw error;
        }
    }

    // Search tutors
    async searchTutors(searchQuery, filters = {}) {
        try {
            const searchFilters = {
                ...filters,
                search: searchQuery,
            };

            return await this.getTutors(searchFilters);
        } catch (error) {
            console.error('[TutorService] Search tutors failed:', error);
            throw error;
        }
    }

    // Get all subjects for filtering
    async getSubjects() {
        try {
            const response = await apiClient.get('/subjects');
            return response.subjects || response;
        } catch (error) {
            console.error('[TutorService] Get subjects failed:', error);
            throw error;
        }
    }

    // Update tutor profile fields lives under /users/:id per backend
    async updateTutorProfile(userId, profileData) {
        try {
            return await apiClient.put(`/users/${userId}`, profileData);
        } catch (error) {
            console.error('[TutorService] Update tutor profile failed:', error);
            throw error;
        }
    }

    // Add subject to tutor (requires tutorId per backend)
    async addSubject(tutorId, subjectId, proficiencyLevel = 'intermediate') {
        try {
            return await apiClient.post(`/tutors/${tutorId}/subjects`, { subjectId, proficiencyLevel });
        } catch (error) {
            console.error('[TutorService] Add subject failed:', error);
            throw error;
        }
    }

    // Remove subject from tutor
    async removeSubject(tutorId, subjectId) {
        try {
            return await apiClient.delete(`/tutors/${tutorId}/subjects/${subjectId}`);
        } catch (error) {
            console.error('[TutorService] Remove subject failed:', error);
            throw error;
        }
    }

    // Availability handled by availabilityService; method kept for back-compat
    async updateAvailability() {
        throw new Error('Use availabilityService to manage availability slots.');
    }

    // Get tutor's availability
    async getTutorAvailability(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/availability`);
            return response.availability || response;
        } catch (error) {
            console.error('[TutorService] Get tutor availability failed:', error);
            throw error;
        }
    }

    // Get tutor statistics (for tutor dashboard)
    async getTutorStats(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/stats`);
            return response.stats || response;
        } catch (error) {
            console.error('[TutorService] Get tutor stats failed:', error);
            throw error;
        }
    }

    // Get comprehensive tutor dashboard data
    async getTutorDashboard(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/dashboard/${tutorId}`);
            return response.dashboard || response;
        } catch (error) {
            console.error('[TutorService] Get tutor dashboard failed:', error);
            throw error;
        }
    }

    // Get tutor analytics data
    async getTutorAnalytics(tutorId, options = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (options.period) queryParams.append('period', options.period);

            const endpoint = `/tutors/analytics/${tutorId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);
            return response.analytics || response;
        } catch (error) {
            console.error('[TutorService] Get tutor analytics failed:', error);
            throw error;
        }
    }

    // Refresh tutor statistics
    async refreshStatistics(tutorId) {
        try {
            const response = await apiClient.post(`/tutors/${tutorId}/refresh-stats`);
            return response;
        } catch (error) {
            console.error('[TutorService] Refresh statistics failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const tutorService = new TutorService();
export default tutorService;