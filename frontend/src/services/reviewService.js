import apiClient from './apiClient';

/**
 * Review Service
 * Contracts mirror backend routes in backend/src/routes/reviews.js
 */
class ReviewService {
    /**
     * Get reviews for a session
     * @param {string} sessionId
     * @returns {Promise<{reviews: Array}>}
     */
    async getBySession(sessionId) {
        return apiClient.get(`/reviews/session/${sessionId}`);
    }

    /**
     * Get public reviews for a tutor
     * @param {string} tutorId
     * @param {{limit?:number, offset?:number}} params
     * @returns {Promise<{reviews: Array, pagination: object}>}
     */
    async getByTutor(tutorId, params = {}) {
        const qs = new URLSearchParams();
        if (params.limit) qs.append('limit', String(params.limit));
        if (params.offset) qs.append('offset', String(params.offset));
        const endpoint = `/reviews/tutor/${tutorId}${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }

    /**
     * Get reviews created by a student (auth required)
     * @param {string} studentId
     * @param {{limit?:number, offset?:number}} params
     * @returns {Promise<{reviews: Array, pagination: object}>}
     */
    async getByStudent(studentId, params = {}) {
        const qs = new URLSearchParams();
        if (params.limit) qs.append('limit', String(params.limit));
        if (params.offset) qs.append('offset', String(params.offset));
        const endpoint = `/reviews/student/${studentId}${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }

    /**
     * Create a review for a session (auth required)
     * @param {{sessionId:string, revieweeId:string, rating:number, comment?:string, wouldRecommend?:boolean}} payload
     * @returns {Promise<{message:string, review: object}>}
     */
    async create(payload) {
        return apiClient.post('/reviews', payload);
    }

    /**
     * Update a review (owner/admin)
     * @param {string} id
     * @param {{rating?:number, comment?:string, wouldRecommend?:boolean}} payload
     * @returns {Promise<{message:string, review: object}>}
     */
    async update(id, payload) {
        return apiClient.put(`/reviews/${id}`, payload);
    }

    /**
     * Delete a review (owner/admin)
     * @param {string} id
     * @returns {Promise<{message:string}>}
     */
    async delete(id) {
        return apiClient.delete(`/reviews/${id}`);
    }
}

const reviewService = new ReviewService();
export default reviewService;
