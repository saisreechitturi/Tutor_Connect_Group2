import apiClient from './apiClient';

/**
 * Analytics Service
 * Handles all analytics-related API calls for tutors
 */
class AnalyticsService {
    /**
     * Get tutor dashboard analytics
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (period, startDate, endDate)
     * @returns {Promise} Analytics data
     */
    async getDashboardAnalytics(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.period) {
                queryParams.append('period', params.period);
            }
            if (params.startDate) {
                queryParams.append('startDate', params.startDate);
            }
            if (params.endDate) {
                queryParams.append('endDate', params.endDate);
            }

            const queryString = queryParams.toString();
            const endpoint = `/analytics/dashboard/${tutorId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            throw error;
        }
    }

    /**
     * Get tutor earnings analytics
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (period, startDate, endDate)
     * @returns {Promise} Earnings data
     */
    async getEarningsAnalytics(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.period) {
                queryParams.append('period', params.period);
            }
            if (params.startDate) {
                queryParams.append('startDate', params.startDate);
            }
            if (params.endDate) {
                queryParams.append('endDate', params.endDate);
            }

            const queryString = queryParams.toString();
            const endpoint = `/analytics/earnings/${tutorId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching earnings analytics:', error);
            throw error;
        }
    }

    /**
     * Get tutor session statistics
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (period)
     * @returns {Promise} Session statistics
     */
    async getSessionStatistics(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.period) {
                queryParams.append('period', params.period);
            }

            const queryString = queryParams.toString();
            const endpoint = `/analytics/sessions/${tutorId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching session statistics:', error);
            throw error;
        }
    }

    /**
     * Get tutor student analytics
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (period)
     * @returns {Promise} Student analytics
     */
    async getStudentAnalytics(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.period) {
                queryParams.append('period', params.period);
            }

            const queryString = queryParams.toString();
            const endpoint = `/analytics/students/${tutorId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching student analytics:', error);
            throw error;
        }
    }

    /**
     * Get tutor performance metrics
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (year, month)
     * @returns {Promise} Performance metrics
     */
    async getPerformanceMetrics(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.year) {
                queryParams.append('year', params.year);
            }
            if (params.month) {
                queryParams.append('month', params.month);
            }

            const queryString = queryParams.toString();
            const endpoint = `/analytics/performance/${tutorId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
