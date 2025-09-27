import apiClient from './apiClient';

class SessionService {
    // Get user's sessions (student or tutor)
    async getSessions(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
            if (filters.type) queryParams.append('type', filters.type); // 'upcoming', 'past', 'today'

            const endpoint = `/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.sessions || response;
        } catch (error) {
            console.error('[SessionService] Get sessions failed:', error);
            throw error;
        }
    }

    // Get session by ID
    async getSessionById(sessionId) {
        try {
            const response = await apiClient.get(`/sessions/${sessionId}`);
            return response.session || response;
        } catch (error) {
            console.error('[SessionService] Get session by ID failed:', error);
            throw error;
        }
    }

    // Create new tutoring session
    async createSession(sessionData) {
        try {
            const response = await apiClient.post('/sessions', {
                tutorId: sessionData.tutorId,
                subjectId: sessionData.subjectId,
                title: sessionData.title,
                description: sessionData.description,
                sessionType: sessionData.sessionType, // 'online' or 'in-person'
                scheduledStart: sessionData.scheduledStart,
                scheduledEnd: sessionData.scheduledEnd,
                hourlyRate: sessionData.hourlyRate,
                meetingLink: sessionData.meetingLink, // for online sessions
                locationAddress: sessionData.locationAddress, // for in-person sessions
            });

            return response;
        } catch (error) {
            console.error('[SessionService] Create session failed:', error);
            throw error;
        }
    }

    // Update session
    async updateSession(sessionId, updateData) {
        try {
            const response = await apiClient.put(`/sessions/${sessionId}`, updateData);
            return response;
        } catch (error) {
            console.error('[SessionService] Update session failed:', error);
            throw error;
        }
    }

    // Cancel session
    async cancelSession(sessionId, reason = '') {
        try {
            const response = await apiClient.put(`/sessions/${sessionId}/cancel`, {
                cancellationReason: reason,
            });
            return response;
        } catch (error) {
            console.error('[SessionService] Cancel session failed:', error);
            throw error;
        }
    }

    // Start session (for tutors)
    async startSession(sessionId) {
        try {
            const response = await apiClient.put(`/sessions/${sessionId}/start`);
            return response;
        } catch (error) {
            console.error('[SessionService] Start session failed:', error);
            throw error;
        }
    }

    // End session (for tutors)
    async endSession(sessionId, sessionNotes = '', homeworkAssigned = '') {
        try {
            const response = await apiClient.put(`/sessions/${sessionId}/end`, {
                sessionNotes,
                homeworkAssigned,
            });
            return response;
        } catch (error) {
            console.error('[SessionService] End session failed:', error);
            throw error;
        }
    }

    // Add session review/rating
    async addSessionReview(sessionId, reviewData) {
        try {
            const response = await apiClient.post(`/sessions/${sessionId}/review`, {
                rating: reviewData.rating,
                reviewText: reviewData.reviewText,
                isPublic: reviewData.isPublic !== false, // default to public
            });
            return response;
        } catch (error) {
            console.error('[SessionService] Add session review failed:', error);
            throw error;
        }
    }

    // Get upcoming sessions
    async getUpcomingSessions() {
        try {
            return await this.getSessions({ type: 'upcoming' });
        } catch (error) {
            console.error('[SessionService] Get upcoming sessions failed:', error);
            throw error;
        }
    }

    // Get past sessions
    async getPastSessions() {
        try {
            return await this.getSessions({ type: 'past' });
        } catch (error) {
            console.error('[SessionService] Get past sessions failed:', error);
            throw error;
        }
    }

    // Get today's sessions
    async getTodaySessions() {
        try {
            return await this.getSessions({ type: 'today' });
        } catch (error) {
            console.error('[SessionService] Get today\'s sessions failed:', error);
            throw error;
        }
    }

    // Check for scheduling conflicts
    async checkAvailability(tutorId, startTime, endTime) {
        try {
            const response = await apiClient.post('/sessions/check-availability', {
                tutorId,
                startTime,
                endTime,
            });
            return response.available || false;
        } catch (error) {
            console.error('[SessionService] Check availability failed:', error);
            throw error;
        }
    }

    // Get session statistics
    async getSessionStats() {
        try {
            const response = await apiClient.get('/sessions/stats');
            return response.stats || response;
        } catch (error) {
            console.error('[SessionService] Get session stats failed:', error);
            throw error;
        }
    }

    // Reschedule session
    async rescheduleSession(sessionId, newStartTime, newEndTime, reason = '') {
        try {
            const response = await apiClient.put(`/sessions/${sessionId}/reschedule`, {
                scheduledStart: newStartTime,
                scheduledEnd: newEndTime,
                reason,
            });
            return response;
        } catch (error) {
            console.error('[SessionService] Reschedule session failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const sessionService = new SessionService();
export default sessionService;