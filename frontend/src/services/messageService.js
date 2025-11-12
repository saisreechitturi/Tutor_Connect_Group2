import apiClient from './apiClient';

class MessageService {
    // Get user's messages/conversations
    async getMessages(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.conversationWith) queryParams.append('conversationWith', filters.conversationWith);
            if (filters.sessionId) queryParams.append('sessionId', filters.sessionId);
            if (filters.isRead !== undefined) queryParams.append('isRead', filters.isRead);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const endpoint = `/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.messages || response;
        } catch (error) {
            console.error('[MessageService] Get messages failed:', error);
            throw error;
        }
    }

    // Get conversation between current user and another user
    async getConversation(otherUserId, sessionId = null) {
        try {
            const filters = { conversationWith: otherUserId };
            if (sessionId) filters.sessionId = sessionId;

            return await this.getMessages(filters);
        } catch (error) {
            console.error('[MessageService] Get conversation failed:', error);
            throw error;
        }
    }

    // Send message
    async sendMessage(messageData) {
        try {
            const response = await apiClient.post('/messages', {
                recipientId: messageData.recipientId,
                sessionId: messageData.sessionId, // optional
                messageText: messageData.messageText,
                messageType: messageData.messageType || 'direct',
                attachmentUrl: messageData.attachmentUrl, // optional
            });

            return response;
        } catch (error) {
            console.error('[MessageService] Send message failed:', error);
            throw error;
        }
    }

    // Mark message as read
    async markAsRead(messageId) {
        try {
            const response = await apiClient.put(`/messages/${messageId}/read`);
            return response;
        } catch (error) {
            console.error('[MessageService] Mark as read failed:', error);
            // Don't throw error for read status updates to avoid disrupting UX
            return null;
        }
    }

    // Mark all messages in conversation as read
    async markConversationAsRead(otherUserId, sessionId = null) {
        try {
            const endpoint = sessionId
                ? `/messages/conversation/${otherUserId}/session/${sessionId}/read`
                : `/messages/conversation/${otherUserId}/read`;

            const response = await apiClient.put(endpoint);
            return response;
        } catch (error) {
            console.error('[MessageService] Mark conversation as read failed:', error);
            // Don't throw error for read status updates to avoid disrupting UX
            return null;
        }
    }

    // Get unread message count
    async getUnreadCount() {
        try {
            // Prefer dedicated endpoint if available
            if (typeof apiClient.get === 'function') {
                try {
                    const res = await apiClient.get('/messages/unread-count');
                    if (res && typeof res.count === 'number') return res.count;
                } catch (_) {
                    // fall back to client-side filtering if endpoint not available
                }
            }

            const list = await this.getMessages({ isRead: false, limit: 200 });
            const arr = Array.isArray(list) ? list : list?.messages || [];
            return arr.filter(m => m.isRead === false).length;
        } catch (error) {
            console.error('[MessageService] Get unread count failed:', error);
            return 0;
        }
    }

    // Get list of conversations (users the current user has messaged with)
    async getConversationsList() {
        // Backend has conversation by user endpoint but not a list; derive from recent messages
        try {
            const { messages = [] } = await this.getMessages({ limit: 100 });
            const byPeer = new Map();
            messages.forEach(m => {
                const me = localStorage.getItem('userId');
                const peerId = m.sender?.id === me ? m.recipient?.id : m.sender?.id;
                if (!peerId) return;
                if (!byPeer.has(peerId)) byPeer.set(peerId, m);
            });
            return Array.from(byPeer.values());
        } catch (error) {
            console.error('[MessageService] Get conversations list failed:', error);
            return [];
        }
    }

    // Delete message
    async deleteMessage(messageId) {
        try {
            const response = await apiClient.delete(`/messages/${messageId}`);
            return response;
        } catch (error) {
            console.error('[MessageService] Delete message failed:', error);
            throw error;
        }
    }

    // Upload attachment for message
    async uploadAttachment(file) {
        try {
            const formData = new FormData();
            formData.append('attachment', file);

            const response = await apiClient.upload('/messages/upload', formData);
            return response.attachmentUrl || response.url;
        } catch (error) {
            console.error('[MessageService] Upload attachment failed:', error);
            throw error;
        }
    }

    // Search messages
    async searchMessages(searchQuery) {
        try {
            const response = await apiClient.get(`/messages/search?q=${encodeURIComponent(searchQuery)}`);
            return response.messages || response;
        } catch (error) {
            console.error('[MessageService] Search messages failed:', error);
            throw error;
        }
    }

    // Get session-related messages
    async getSessionMessages(sessionId) {
        try {
            return await this.getMessages({ sessionId });
        } catch (error) {
            console.error('[MessageService] Get session messages failed:', error);
            throw error;
        }
    }

    // Send system message (for session updates, etc.)
    async sendSystemMessage() {
        throw new Error('System messages endpoint is not available on the backend.');
    }
}

// Create and export singleton instance
const messageService = new MessageService();
export default messageService;