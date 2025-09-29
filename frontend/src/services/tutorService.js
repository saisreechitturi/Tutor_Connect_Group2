import apiClient from './apiClient';

class TutorService {
    // Get all tutors with optional filters
    async getTutors(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.subject) queryParams.append('subject', filters.subject);
            if (filters.priceRange) {
                queryParams.append('minPrice', filters.priceRange[0]);
                queryParams.append('maxPrice', filters.priceRange[1]);
            }
            if (filters.rating) queryParams.append('minRating', filters.rating);
            if (filters.availability) queryParams.append('availability', filters.availability);
            if (filters.sessionType) queryParams.append('sessionType', filters.sessionType);
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

    // Update tutor profile (for tutors only)
    async updateTutorProfile(profileData) {
        try {
            const response = await apiClient.put('/tutors/profile', profileData);
            return response;
        } catch (error) {
            console.error('[TutorService] Update tutor profile failed:', error);
            throw error;
        }
    }

    // Add subject to tutor (for tutors only)
    async addSubject(subjectId, proficiencyLevel = 'intermediate') {
        try {
            const response = await apiClient.post('/tutors/subjects', {
                subjectId,
                proficiencyLevel,
            });
            return response;
        } catch (error) {
            console.error('[TutorService] Add subject failed:', error);
            throw error;
        }
    }

    // Remove subject from tutor (for tutors only)
    async removeSubject(subjectId) {
        try {
            const response = await apiClient.delete(`/tutors/subjects/${subjectId}`);
            return response;
        } catch (error) {
            console.error('[TutorService] Remove subject failed:', error);
            throw error;
        }
    }

    // Update tutor availability
    async updateAvailability(availabilityData) {
        try {
            const response = await apiClient.put('/tutors/availability', availabilityData);
            return response;
        } catch (error) {
            console.error('[TutorService] Update availability failed:', error);
            throw error;
        }
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

    // Get tutor's students
    async getTutorStudents(tutorId) {
        try {
            const response = await apiClient.get(`/tutors/${tutorId}/students`);
            return response.students || response;
        } catch (error) {
            console.error('[TutorService] Get tutor students failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const tutorService = new TutorService();
export default tutorService;