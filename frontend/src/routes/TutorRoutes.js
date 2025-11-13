import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TutorDashboard from '../components/dashboard/TutorDashboard';
import TutorMessages from '../pages/TutorMessages';
import TutorCalendar from '../pages/TutorCalendar';
import TutorStudents from '../pages/TutorStudents';
import TutorAnalytics from '../pages/TutorAnalytics';
import TutorAvailability from '../pages/TutorAvailability';
import TutorSettings from '../pages/TutorSettings';
import TutorTasks from '../pages/TutorTasks';
import Notifications from '../pages/Notifications';

const TutorRoutes = () => {
    return (
        <DashboardLayout userRole="tutor">
            <Routes>
                <Route index element={<TutorDashboard />} />
                <Route path="students" element={<TutorStudents />} />
                <Route path="sessions" element={<TutorStudents />} />
                <Route path="analytics" element={<TutorAnalytics />} />
                <Route path="availability" element={<TutorAvailability />} />
                <Route path="tasks" element={<TutorTasks />} />
                <Route path="calendar" element={<TutorCalendar />} />
                <Route path="messages" element={<TutorMessages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<TutorSettings />} />
            </Routes>
        </DashboardLayout>
    );
};

export default TutorRoutes;