import apiClient from './apiClient';

class AIService {
    /**
     * Get all chat sessions for the authenticated user
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise} - API response
     */
    async getChatSessions(page = 1, limit = 20) {
        try {
            const response = await apiClient.get('/ai-chat/sessions', {
                params: { page, limit }
            });
            return response;
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            throw error;
        }
    }

    /**
     * Create a new chat session
     * @param {string} title - Optional title for the session
     * @returns {Promise} - API response
     */
    async createChatSession(title = 'New Chat') {
        try {
            const response = await apiClient.post('/ai-chat/sessions', { title });
            return response;
        } catch (error) {
            console.error('Error creating chat session:', error);
            throw error;
        }
    }

    /**
     * Get all messages for a specific chat session
     * @param {string} sessionId - Session ID
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise} - API response
     */
    async getChatMessages(sessionId, page = 1, limit = 50) {
        try {
            const response = await apiClient.get(`/ai-chat/sessions/${sessionId}/messages`, {
                params: { page, limit }
            });
            return response;
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            throw error;
        }
    }

    /**
     * Send a message to the AI and get a response
     * @param {string} sessionId - Session ID
     * @param {string} message - User message
     * @returns {Promise} - API response
     */
    async sendMessage(sessionId, message) {
        try {
            const response = await apiClient.post(`/ai-chat/sessions/${sessionId}/messages`, {
                message: message.trim()
            });
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Update a chat session
     * @param {string} sessionId - Session ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise} - API response
     */
    async updateChatSession(sessionId, updates) {
        try {
            const response = await apiClient.put(`/ai-chat/sessions/${sessionId}`, updates);
            return response;
        } catch (error) {
            console.error('Error updating chat session:', error);
            throw error;
        }
    }

    /**
     * Delete a chat session
     * @param {string} sessionId - Session ID
     * @returns {Promise} - API response
     */
    async deleteChatSession(sessionId) {
        try {
            const response = await apiClient.delete(`/ai-chat/sessions/${sessionId}`);
            return response;
        } catch (error) {
            console.error('Error deleting chat session:', error);
            throw error;
        }
    }

    /**
     * Get AI chat usage statistics
     * @returns {Promise} - API response
     */
    async getChatStats() {
        try {
            const response = await apiClient.get('/ai-chat/stats');
            return response;
        } catch (error) {
            console.error('Error fetching chat stats:', error);
            throw error;
        }
    }

    /**
     * Validate message before sending
     * @param {string} message - Message to validate
     * @returns {Object} - Validation result
     */
    validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return { isValid: false, error: 'Message is required' };
        }

        const trimmedMessage = message.trim();

        if (trimmedMessage.length === 0) {
            return { isValid: false, error: 'Message cannot be empty' };
        }

        if (trimmedMessage.length > 2000) {
            return { isValid: false, error: 'Message is too long (max 2000 characters)' };
        }

        return { isValid: true, message: trimmedMessage };
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} - Formatted time
     */
    formatTimestamp(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }

    /**
     * Truncate text for preview
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

export default new AIService();