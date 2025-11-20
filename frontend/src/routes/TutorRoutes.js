import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TutorDashboard from '../components/dashboard/TutorDashboard';
import TutorAnalytics from '../pages/TutorAnalytics';
import TutorAvailability from '../pages/TutorAvailability';
import TutorSettings from '../pages/TutorSettings';
// Use the same working components that students use
import TaskManager from '../components/ui/TaskManager';
import TutorCalendar from '../pages/TutorCalendar';
import Messages from '../components/ui/Messages';
import MySessions from '../components/ui/MySessions';

const TutorRoutes = () => {
    return (
        <DashboardLayout userRole="tutor">
            <Routes>
                <Route index element={<TutorDashboard />} />
                <Route path="sessions" element={<MySessions />} />
                <Route path="analytics" element={<TutorAnalytics />} />
                <Route path="availability" element={<TutorAvailability />} />
                <Route path="tasks" element={<TaskManager />} />
                <Route path="calendar" element={<TutorCalendar />} />
                <Route path="messages" element={<Messages />} />
                <Route path="settings" element={<TutorSettings />} />
            </Routes>
        </DashboardLayout>
    );
};

export default TutorRoutes;