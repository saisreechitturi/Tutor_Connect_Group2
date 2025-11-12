import apiClient from './apiClient';

/**
 * Settings Service (admin)
 * Mirrors backend/src/routes/admin.js settings endpoints
 */
class SettingsService {
    /**
     * List settings (admin)
     * @param {{category?:string, key?:string}} params
     * @returns {Promise<{settings: Record<string, Array>}>}
     */
    async list(params = {}) {
        const qs = new URLSearchParams();
        if (params.category) qs.append('category', params.category);
        if (params.key) qs.append('key', params.key);
        const endpoint = `/admin/settings${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }

    /**
     * Update a setting by key (admin)
     * @param {string} key
     * @param {{value:any, description?:string}} payload
     * @returns {Promise<{message:string, setting: object}>}
     */
    async update(key, payload) {
        return apiClient.put(`/admin/settings/${encodeURIComponent(key)}`, payload);
    }

    /**
     * Create a setting (admin)
     * @param {{key:string, value:any, category:string, description?:string, dataType?:'string'|'number'|'boolean'|'json', isPublic?:boolean}} payload
     * @returns {Promise<{message:string, setting: object}>}
     */
    async create(payload) {
        return apiClient.post('/admin/settings', payload);
    }

    /**
     * Delete a setting by key (admin)
     * @param {string} key
     * @returns {Promise<{message:string}>}
     */
    async remove(key) {
        return apiClient.delete(`/admin/settings/${encodeURIComponent(key)}`);
    }
}

const settingsService = new SettingsService();
export default settingsService;
