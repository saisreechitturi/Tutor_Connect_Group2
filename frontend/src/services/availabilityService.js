import apiClient from './apiClient';

/**
 * Availability Service
 * Handles all tutor availability-related API calls
 */
class AvailabilityService {
    /**
     * Get tutor availability slots
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (date, weekStart, includeBooked)
     * @returns {Promise} Availability slots
     */
    async getAvailability(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (params.date) {
                queryParams.append('date', params.date);
            }
            if (params.weekStart) {
                queryParams.append('weekStart', params.weekStart);
            }
            if (params.includeBooked !== undefined) {
                queryParams.append('includeBooked', params.includeBooked);
            }

            const queryString = queryParams.toString();
            const endpoint = `/availability/${tutorId}${queryString ? `?${queryString}` : ''}`;

            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching availability:', error);
            throw error;
        }
    }

    /**
     * Get available time slots for a specific date
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (date, duration)
     * @returns {Promise} Available time slots
     */
    async getAvailableTimeSlots(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (params.date) {
                queryParams.append('date', params.date);
            }
            if (params.duration) {
                queryParams.append('duration', params.duration);
            }

            const queryString = queryParams.toString();
            const endpoint = `/availability/${tutorId}/slots${queryString ? `?${queryString}` : ''}`;

            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            throw error;
        }
    }

    /**
     * Get availability overview for multiple dates (for calendar highlighting)
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (startDate, endDate, duration)
     * @returns {Promise} Date availability overview
     */
    async getAvailabilityOverview(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (params.startDate) {
                queryParams.append('startDate', params.startDate);
            }
            if (params.endDate) {
                queryParams.append('endDate', params.endDate);
            }
            if (params.duration) {
                queryParams.append('duration', params.duration);
            }

            const queryString = queryParams.toString();
            const endpoint = `/availability/${tutorId}/overview${queryString ? `?${queryString}` : ''}`;

            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching availability overview:', error);
            throw error;
        }
    }

    /**
     * Create new availability slot
     * @param {string} tutorId - The tutor's user ID
     * @param {object} slotData - Slot data (day_of_week, start_time, end_time, etc.)
     * @returns {Promise} Created slot
     */
    async createRecurringSlot(tutorId, slotData) {
        try {
            // slotData: { dayOfWeek, startTime, endTime }
            return await apiClient.post(`/availability/${tutorId}/recurring`, slotData);
        } catch (error) {
            console.error('Error creating recurring availability slot:', error);
            throw error;
        }
    }



    /**
     * Update availability slot
     * @param {string} tutorId - The tutor's user ID
     * @param {string} slotId - The slot ID
     * @param {object} slotData - Updated slot data
     * @returns {Promise} Updated slot
     */
    async updateSlot(tutorId, slotId, slotData) {
        try {
            return await apiClient.put(`/availability/${tutorId}/slots/${slotId}`, slotData);
        } catch (error) {
            console.error('Error updating availability slot:', error);
            throw error;
        }
    }

    /**
     * Delete availability slot
     * @param {string} tutorId - The tutor's user ID
     * @param {string} slotId - The slot ID
     * @returns {Promise} Deletion confirmation
     */
    async deleteSlot(tutorId, slotId) {
        try {
            return await apiClient.delete(`/availability/${tutorId}/slots/${slotId}`);
        } catch (error) {
            console.error('Error deleting availability slot:', error);
            throw error;
        }
    }

    /**
     * Bulk update availability slots
     * @param {string} tutorId - The tutor's user ID
     * @param {array} slots - Array of slot objects
     * @returns {Promise} Updated slots
     */
    async bulkUpdateSlots(_tutorId, _slots) {
        try {
            // Not implemented on backend yet; intentionally left as a placeholder.
            // Consider removing or implementing server route if needed.
            // Parameters prefixed with _ to indicate intentionally unused per ESLint config
            throw new Error('Not implemented: bulk update slots');
        } catch (error) {
            console.error('Error bulk updating availability slots:', error);
            throw error;
        }
    }



    // Backward-compatible alias: createSlot -> createRecurringSlot
    async createSlot(tutorId, slotData) {
        return this.createRecurringSlot(tutorId, slotData);
    }
}

// Create and export singleton instance
const availabilityService = new AvailabilityService();
export default availabilityService;
