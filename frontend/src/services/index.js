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
import calendarService from './calendarService';
import analyticsService from './analyticsService';
import availabilityService from './availabilityService';
import paymentService from './paymentService';

// Export individual services
export { 
    apiClient, 
    authService, 
    tutorService, 
    sessionService, 
    messageService, 
    taskService, 
    adminService, 
    userService, 
    calendarService,
    analyticsService,
    availabilityService,
    paymentService
};

// Re-export for convenience
export {
    apiClient as api,
    authService as auth,
    tutorService as tutors,
    sessionService as sessions,
    messageService as messages,
    taskService as tasks,
    adminService as admin,
    userService as users,
    calendarService as calendar,
    analyticsService as analytics,
    availabilityService as availability,
    paymentService as payments
};