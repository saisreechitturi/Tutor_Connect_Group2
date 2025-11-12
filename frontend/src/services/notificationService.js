import apiClient from './apiClient';

/**
 * Notification Service
 * Currently admin-centric per backend/src/routes/admin.js
 */
class NotificationService {
    /**
     * Send a broadcast notification (admin)
     * @param {{title:string, message:string, type?:string, targetRole?:'student'|'tutor'|'all'}} payload
     * @returns {Promise<{message:string, recipientCount:number}>}
     */
    async send(payload) {
        return apiClient.post('/admin/notifications', payload);
    }

    /**
     * List notifications/announcements (admin)
     * @param {{type?:string, limit?:number, offset?:number}} params
     * @returns {Promise<{notifications:Array}>}
     */
    async list(params = {}) {
        const qs = new URLSearchParams();
        if (params.type) qs.append('type', params.type);
        if (params.limit) qs.append('limit', String(params.limit));
        if (params.offset) qs.append('offset', String(params.offset));
        const endpoint = `/admin/notifications${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }
}

const notificationService = new NotificationService();
export default notificationService;
