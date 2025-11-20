import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TaskManager from '../components/ui/TaskManager';
import TutorSearch from '../components/ui/TutorSearch';
import StudentCalendar from '../pages/StudentCalendar';
import Messages from '../components/ui/Messages';
import MySessions from '../components/ui/MySessions';
import StudentSettings from '../pages/StudentSettings';

const StudentRoutes = () => {
    return (
        <DashboardLayout userRole="student">
            <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="tutors" element={<TutorSearch />} />
                <Route path="sessions" element={<MySessions />} />
                <Route path="tasks" element={<TaskManager />} />
                <Route path="calendar" element={<StudentCalendar />} />
                <Route path="messages" element={<Messages />} />
                <Route path="settings" element={<StudentSettings />} />
            </Routes>
        </DashboardLayout>
    );
};

export default StudentRoutes;