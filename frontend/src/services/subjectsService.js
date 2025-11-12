import apiClient from './apiClient';

/**
 * Subjects Service
 * Contracts mirror backend routes in backend/src/routes/subjects.js
 */
class SubjectsService {
    /**
     * List subjects (public)
     * @param {{category?: string, active?: boolean, search?: string, limit?: number, offset?: number}} params
     * @returns {Promise<{subjects: Array, pagination: {total:number, limit:number, offset:number, hasMore:boolean}}>} 
     */
    async list(params = {}) {
        const qs = new URLSearchParams();
        if (params.category) qs.append('category', params.category);
        if (params.active !== undefined) qs.append('active', String(params.active));
        if (params.search) qs.append('search', params.search);
        if (params.limit) qs.append('limit', String(params.limit));
        if (params.offset) qs.append('offset', String(params.offset));
        const endpoint = `/subjects${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }

    /**
     * Get a single subject with top tutors
     * @param {string} id
     * @returns {Promise<{subject: object}>}
     */
    async getById(id) {
        return apiClient.get(`/subjects/${id}`);
    }

    /**
     * Get subject categories (public)
     * @returns {Promise<{categories: string[]}>}
     */
    async getCategories() {
        return apiClient.get('/subjects/meta/categories');
    }

    // Admin-only endpoints

    /**
     * Create a subject (admin)
     * @param {{name:string, description?:string, category?:string}} payload
     * @returns {Promise<{subject: object}>}
     */
    async create(payload) {
        return apiClient.post('/subjects', payload);
    }

    /**
     * Update a subject (admin)
     * @param {string} id
     * @param {{name?:string, description?:string, category?:string, isActive?:boolean}} payload
     * @returns {Promise<{subject: object}>}
     */
    async update(id, payload) {
        return apiClient.put(`/subjects/${id}`, payload);
    }

    /**
     * Delete a subject (admin)
     * @param {string} id
     * @returns {Promise<{message:string}>}
     */
    async delete(id) {
        return apiClient.delete(`/subjects/${id}`);
    }
}

const subjectsService = new SubjectsService();
export default subjectsService;
