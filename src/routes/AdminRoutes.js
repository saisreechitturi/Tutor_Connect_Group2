import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminUserManagement from '../pages/AdminUserManagement';
import AdminSessionManagement from '../pages/AdminSessionManagement';
import AdminPlatformAnalytics from '../pages/AdminPlatformAnalytics';
import AdminTasksManagement from '../pages/AdminTasksManagement';

const AdminDashboard = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-purple-100">
                Monitor platform activity, manage users, and oversee system operations.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-purple-600">1,247</p>
                <p className="text-sm text-gray-500 mt-1">↗ 12% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Sessions</h3>
                <p className="text-3xl font-bold text-green-600">89</p>
                <p className="text-sm text-gray-500 mt-1">Currently ongoing</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
                <p className="text-3xl font-bold text-blue-600">$24,586</p>
                <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Management</h2>
            <p className="text-gray-600">
                Advanced admin features including user management, content moderation, analytics, and system settings will be available soon.
            </p>
        </div>
    </div>
);

const AdminRoutes = () => {
    return (
        <DashboardLayout userRole="admin">
            <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="sessions" element={<AdminSessionManagement />} />
                <Route path="analytics" element={<AdminPlatformAnalytics />} />
                <Route path="tasks" element={<AdminTasksManagement />} />
                <Route path="calendar" element={<div className="p-4">Calendar - Coming Soon</div>} />
                <Route path="messages" element={<div className="p-4">Messages - Coming Soon</div>} />
                <Route path="settings" element={<div className="p-4">System Settings - Coming Soon</div>} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminRoutes;