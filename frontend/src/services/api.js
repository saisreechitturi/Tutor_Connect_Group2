import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL || 'https://your-backend-url.onrender.com'
    : 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors and auto-refresh tokens
api.interceptors.response.use(
    (response) => {
        // Check for auto-refreshed token in response headers
        const newToken = response.headers['x-new-token'];
        if (newToken) {
            console.log('[API] Auto-refreshing token via Axios interceptor');
            localStorage.setItem('token', newToken);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    updatePassword: (passwords) => api.put('/auth/password', passwords)
};

// Users API
export const usersAPI = {
    getProfile: (id) => api.get(`/users/${id}`),
    updateProfile: (id, userData) => api.put(`/users/${id}`, userData),
    getUserSessions: (id, params = {}) => api.get(`/users/${id}/sessions`, { params }),
    getUserTasks: (id, params = {}) => api.get(`/users/${id}/tasks`, { params })
};

// Tutors API
export const tutorsAPI = {
    getAllTutors: (params = {}) => api.get('/tutors', { params }),
    getTutorProfile: (id) => api.get(`/tutors/${id}`)
};

// Tasks API
export const tasksAPI = {
    getAllTasks: (params = {}) => api.get('/tasks', { params }),
    getTask: (id) => api.get(`/tasks/${id}`),
    createTask: (taskData) => api.post('/tasks', taskData),
    updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
    deleteTask: (id) => api.delete(`/tasks/${id}`)
};

// Sessions API
export const sessionsAPI = {
    getAllSessions: (params = {}) => api.get('/sessions', { params }),
    getSession: (id) => api.get(`/sessions/${id}`),
    createSession: (sessionData) => api.post('/sessions', sessionData),
    updateSession: (id, sessionData) => api.put(`/sessions/${id}`, sessionData),
    cancelSession: (id) => api.delete(`/sessions/${id}`)
};

// Messages API
export const messagesAPI = {
    getAllMessages: (params = {}) => api.get('/messages', { params }),
    getMessage: (id) => api.get(`/messages/${id}`),
    sendMessage: (messageData) => api.post('/messages', messageData),
    markAsRead: (id) => api.patch(`/messages/${id}/read`),
    deleteMessage: (id) => api.delete(`/messages/${id}`),
    getConversation: (userId, params = {}) => api.get(`/messages/conversation/${userId}`, { params })
};

// Admin API
export const adminAPI = {
    getAllUsers: (params = {}) => api.get('/admin/users', { params }),
    updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
    getStats: () => api.get('/admin/stats'),
    getAllSessions: (params = {}) => api.get('/admin/sessions', { params }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    sendNotification: (notificationData) => api.post('/admin/notifications', notificationData)
};

export default api;