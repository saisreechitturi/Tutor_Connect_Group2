import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProfileChecker from '../components/ProfileChecker';
import Calendar from '../components/ui/Calendar';
import Messages from '../components/ui/Messages';
import MySessions from '../components/ui/MySessions';
import TutorStudents from '../pages/TutorStudents';
import TutorAnalytics from '../pages/TutorAnalytics';
import TutorTasks from '../pages/TutorTasks';
import TutorSettings from '../pages/TutorSettings';
import TutorAvailability from '../pages/TutorAvailability';
import Notifications from '../pages/Notifications';

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
        <ProfileChecker>
            <DashboardLayout userRole="tutor">
                <Routes>
                    <Route index element={<TutorDashboard />} />
                    <Route path="students" element={<TutorStudents />} />
                    <Route path="sessions" element={<MySessions />} />
                    <Route path="analytics" element={<TutorAnalytics />} />
                    <Route path="availability" element={<TutorAvailability />} />
                    <Route path="tasks" element={<TutorTasks />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="settings" element={<TutorSettings />} />
                </Routes>
            </DashboardLayout>
        </ProfileChecker>
    );
};

export default TutorRoutes;