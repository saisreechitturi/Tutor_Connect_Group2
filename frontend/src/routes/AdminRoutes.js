import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminUserManagement from '../pages/AdminUserManagement';
import AdminSessionManagement from '../pages/AdminSessionManagement';
import AdminReviewsManagement from '../pages/AdminReviewsManagement';
import { adminService } from '../services';
// Removed advanced analytics and admin messaging per scope simplification

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSessions: 0,
        totalRevenue: 0,
        totalSessions: 0,
        recentActivity: { newUsers: 0, newSessions: 0 },
        topTutors: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getStats();

            // Process user stats
            const userStats = data.userStats || [];
            const totalUsers = userStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

            // Process session stats
            const sessionStats = data.sessionStats || [];
            const activeSessions = sessionStats.find(s => s.status === 'in_progress')?.count || 0;
            const totalRevenue = sessionStats.reduce((sum, stat) => sum + parseFloat(stat.total_revenue || 0), 0);

            setStats({
                totalUsers,
                activeSessions: parseInt(activeSessions),
                totalRevenue,
                totalSessions: data.totalSessions || 0,
                recentActivity: data.recentActivity || { newUsers: 0, newSessions: 0 },
                topTutors: data.topTutors || []
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError('Failed to load dashboard statistics');
            // Use fallback data
            setStats({
                totalUsers: 0,
                activeSessions: 0,
                totalRevenue: 0,
                totalSessions: 0,
                recentActivity: { newUsers: 0, newSessions: 0 },
                topTutors: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="mt-2 text-purple-100">
                        Monitor platform activity, manage users, and oversee system operations.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="mt-2 text-purple-100">
                    Monitor platform activity, manage users, and oversee system operations.
                </p>
            </div>

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="mt-2 text-yellow-700 underline hover:text-yellow-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {stats.recentActivity.newUsers > 0 ? `↗ ${stats.recentActivity.newUsers} new this month` : 'No new users this month'}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sessions</h3>
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalSessions.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">All sessions created</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Sessions</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
                    <p className="text-sm text-gray-500 mt-1">Currently ongoing</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Payments Made</h3>
                    <p className="text-3xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">From completed sessions</p>
                </div>
            </div>
        </div>
    );
};

const AdminRoutes = () => {
    return (
        <DashboardLayout userRole="admin">
            <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="sessions" element={<AdminSessionManagement />} />
                <Route path="reviews" element={<AdminReviewsManagement />} />
                {/* Analytics, Admin Messaging, and Settings removed */}
            </Routes>
        </DashboardLayout>
    );
};

export default AdminRoutes;