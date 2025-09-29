// API Services - Export all services from a single entry point

// Import all services
import apiClient from './apiClient';
import authService from './authService';
import tutorService from './tutorService';
import sessionService from './sessionService';
import messageService from './messageService';
import taskService from './taskService';
import adminService from './adminService';
import userService from './userService';

// Export individual services
export { apiClient, authService, tutorService, sessionService, messageService, taskService, adminService, userService };

// Re-export for convenience
export {
    apiClient as api,
    authService as auth,
    tutorService as tutors,
    sessionService as sessions,
    messageService as messages,
    taskService as tasks,
    adminService as admin,
    userService as users
};