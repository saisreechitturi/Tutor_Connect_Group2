import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Calendar from '../components/ui/Calendar';
import Messages from '../components/ui/Messages';
import MySessions from '../components/ui/MySessions';

const TutorDashboard = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold">Tutor Dashboard</h1>
            <p className="mt-2 text-green-100">
                Manage your students, sessions, and track your teaching progress.
            </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600">
                Tutor-specific features including student management, session analytics, and earnings tracking will be available soon.
            </p>
        </div>
    </div>
);

const TutorRoutes = () => {
    return (
        <DashboardLayout userRole="tutor">
            <Routes>
                <Route index element={<TutorDashboard />} />
                <Route path="students" element={<div className="p-4">My Students - Coming Soon</div>} />
                <Route path="sessions" element={<MySessions />} />
                <Route path="analytics" element={<div className="p-4">Analytics - Coming Soon</div>} />
                <Route path="tasks" element={<div className="p-4">Tasks - Coming Soon</div>} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="messages" element={<Messages />} />
                <Route path="settings" element={<div className="p-4">Settings - Coming Soon</div>} />
            </Routes>
        </DashboardLayout>
    );
};

export default TutorRoutes;