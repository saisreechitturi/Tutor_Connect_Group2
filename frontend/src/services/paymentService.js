import apiClient from './apiClient';

/**
 * Payment Service
 * Handles all payment-related API calls
 */
class PaymentService {
    /**
     * Create payment for session booking
     * @param {string} sessionId - The session ID
     * @param {object} paymentData - Payment data (paymentMethod, savePaymentMethod)
     * @returns {Promise} Payment confirmation
     */
    async createSessionPayment(sessionId, paymentData) {
        try {
            return await apiClient.post(`/payments/session/${sessionId}`, paymentData);
        } catch (error) {
            console.error('Error creating session payment:', error);
            throw error;
        }
    }

    /**
     * Get user's payment history
     * @param {string} userId - The user's ID
     * @param {object} params - Query parameters (type, status, limit, offset)
     * @returns {Promise} Payment history
     */
    async getUserPayments(userId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.type) {
                queryParams.append('type', params.type);
            }
            if (params.status) {
                queryParams.append('status', params.status);
            }
            if (params.limit) {
                queryParams.append('limit', params.limit);
            }
            if (params.offset) {
                queryParams.append('offset', params.offset);
            }

            const queryString = queryParams.toString();
            const endpoint = `/payments/user/${userId}${queryString ? `?${queryString}` : ''}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching user payments:', error);
            throw error;
        }
    }

    /**
     * Get payment details
     * @param {string} paymentId - The payment ID
     * @returns {Promise} Payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            return await apiClient.get(`/payments/${paymentId}`);
        } catch (error) {
            console.error('Error fetching payment details:', error);
            throw error;
        }
    }

    /**
     * Request payment refund
     * @param {string} paymentId - The payment ID
     * @param {object} refundData - Refund data (reason, amount)
     * @returns {Promise} Refund confirmation
     */
    async requestRefund(paymentId, refundData) {
        try {
            return await apiClient.post(`/payments/${paymentId}/refund`, refundData);
        } catch (error) {
            console.error('Error requesting refund:', error);
            throw error;
        }
    }

    /**
     * Get tutor earnings summary
     * @param {string} tutorId - The tutor's user ID
     * @param {object} params - Query parameters (period, status)
     * @returns {Promise} Earnings summary
     */
    async getTutorEarnings(tutorId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('type', 'earnings');
            
            if (params.status) {
                queryParams.append('status', params.status);
            }
            if (params.limit) {
                queryParams.append('limit', params.limit);
            }
            if (params.offset) {
                queryParams.append('offset', params.offset);
            }

            const queryString = queryParams.toString();
            const endpoint = `/payments/user/${tutorId}?${queryString}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching tutor earnings:', error);
            throw error;
        }
    }

    /**
     * Get student payment history
     * @param {string} studentId - The student's user ID
     * @param {object} params - Query parameters (status, limit, offset)
     * @returns {Promise} Payment history
     */
    async getStudentPayments(studentId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('type', 'payments');
            
            if (params.status) {
                queryParams.append('status', params.status);
            }
            if (params.limit) {
                queryParams.append('limit', params.limit);
            }
            if (params.offset) {
                queryParams.append('offset', params.offset);
            }

            const queryString = queryParams.toString();
            const endpoint = `/payments/user/${studentId}?${queryString}`;
            
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Error fetching student payments:', error);
            throw error;
        }
    }

    /**
     * Save payment method
     * @param {object} paymentMethodData - Payment method data
     * @returns {Promise} Saved payment method
     */
    async savePaymentMethod(paymentMethodData) {
        try {
            return await apiClient.post('/payments/methods', paymentMethodData);
        } catch (error) {
            console.error('Error saving payment method:', error);
            throw error;
        }
    }

    /**
     * Get saved payment methods
     * @param {string} userId - The user's ID
     * @returns {Promise} Saved payment methods
     */
    async getPaymentMethods(userId) {
        try {
            return await apiClient.get(`/payments/methods/${userId}`);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            throw error;
        }
    }

    /**
     * Delete payment method
     * @param {string} methodId - The payment method ID
     * @returns {Promise} Deletion confirmation
     */
    async deletePaymentMethod(methodId) {
        try {
            return await apiClient.delete(`/payments/methods/${methodId}`);
        } catch (error) {
            console.error('Error deleting payment method:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const paymentService = new PaymentService();
export default paymentService;
