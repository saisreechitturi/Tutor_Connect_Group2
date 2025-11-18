import apiClient from './apiClient';
import availabilityService from './availabilityService';

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

    // Create new tutoring session (align with backend contracts)
    // Accepts { tutorId, subjectId, title, description, sessionType, scheduledStart, scheduledEnd, hourlyRate, meetingLink, locationAddress }
    async createSession(sessionData) {
        try {
            const payload = {
                tutorId: sessionData.tutorId,
                subjectId: sessionData.subjectId,
                title: sessionData.title,
                description: sessionData.description,
                sessionType: sessionData.sessionType,
                scheduledStart: sessionData.scheduledStart,
                scheduledEnd: sessionData.scheduledEnd,
                hourlyRate: sessionData.hourlyRate,
                meetingLink: sessionData.meetingLink,
                locationAddress: sessionData.locationAddress
            };

            return await apiClient.post('/sessions', payload);
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

    // Cancel session (backend uses DELETE /sessions/:id)
    async cancelSession(sessionId) {
        try {
            return await apiClient.delete(`/sessions/${sessionId}`);
        } catch (error) {
            console.error('[SessionService] Cancel session failed:', error);
            throw error;
        }
    }

    // Start session: use generic update to set status to in_progress
    async startSession(sessionId) {
        try {
            return await apiClient.put(`/sessions/${sessionId}`, { status: 'in_progress' });
        } catch (error) {
            console.error('[SessionService] Start session failed:', error);
            throw error;
        }
    }

    // End session (for tutors): set status completed and add notes
    async endSession(sessionId, sessionNotes = '') {
        try {
            return await apiClient.put(`/sessions/${sessionId}`, {
                status: 'completed',
                sessionNotes,
            });
        } catch (error) {
            console.error('[SessionService] End session failed:', error);
            throw error;
        }
    }

    // Reviews are handled by reviewService; keep a thin helper if needed
    async addSessionReview() {
        throw new Error('Use reviewService.create({ sessionId, revieweeId, rating, comment, wouldRecommend })');
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

    // Check for scheduling conflicts by comparing with bookable slots
    async checkAvailability(tutorId, startTime, endTime) {
        try {
            const date = new Date(startTime).toISOString().split('T')[0];
            const { availableSlots = [] } = await availabilityService.getAvailableTimeSlots(tutorId, { date, duration: Math.max(15, Math.round((new Date(endTime) - new Date(startTime)) / 60000)) });
            // Use UTC to avoid timezone drift when matching against slot strings like 'HH:MM'
            const startHHMM = new Date(startTime).toISOString().substr(11, 5);
            const endHHMM = new Date(endTime).toISOString().substr(11, 5);
            return availableSlots.some(s => s.date === date && s.startTime === startHHMM && s.endTime === endHHMM);
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

    // Reschedule session (use scheduledStart/scheduledEnd)
    async rescheduleSession(sessionId, newStartTime, newEndTime) {
        try {
            return await apiClient.put(`/sessions/${sessionId}`, {
                scheduledStart: new Date(newStartTime).toISOString(),
                scheduledEnd: new Date(newEndTime).toISOString()
            });
        } catch (error) {
            console.error('[SessionService] Reschedule session failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const sessionService = new SessionService();
export default sessionService;