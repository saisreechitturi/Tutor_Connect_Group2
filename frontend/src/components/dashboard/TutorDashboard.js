import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Users, TrendingUp, Star, BookOpen, Award, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import tutorService from '../../services/tutorService';

const TutorDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshDashboard = async (forceRefresh = false) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // If force refresh is requested, refresh statistics first
            if (forceRefresh) {
                try {
                    await tutorService.refreshStatistics(user.id);
                    console.log('Statistics refreshed successfully');
                } catch (statsError) {
                    console.warn('Failed to refresh statistics, continuing with dashboard fetch:', statsError);
                }
            }

            const response = await tutorService.getTutorDashboard(user.id);
            // Handle the response format from the backend (response.dashboard)
            const data = response.dashboard || response;
            console.log('Dashboard data received:', data); // Debug log
            setDashboardData(data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    }; useEffect(() => {
        refreshDashboard();
    }, [user?.id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'text-blue-600 bg-blue-100',
            completed: 'text-green-600 bg-green-100',
            cancelled: 'text-red-600 bg-red-100',
            in_progress: 'text-yellow-600 bg-yellow-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold">Tutor Dashboard</h1>
                    <p className="mt-2 text-green-100">Loading your dashboard...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold">Tutor Dashboard</h1>
                    <p className="mt-2 text-green-100">
                        Manage your students, sessions, and track your teaching progress.
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                        <button
                            onClick={() => refreshDashboard(true)}
                            disabled={loading}
                            className="ml-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || user?.profile?.firstName || 'Tutor'}!</h1>
                        <p className="mt-2 text-green-100">
                            Manage your students, sessions, and track your teaching progress.
                        </p>
                    </div>
                    <button
                        onClick={() => refreshDashboard(true)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                        title="Refresh Dashboard & Update Earnings"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {dashboardData?.nextSession && (
                    <div className="mt-4 bg-green-500 bg-opacity-50 rounded-lg p-3">
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Next Session:</span>
                        </div>
                        <p className="text-sm mt-1">
                            {dashboardData.nextSession.title} with {dashboardData.nextSession.student}
                        </p>
                        <p className="text-xs text-green-100">
                            {formatDate(dashboardData.nextSession.scheduledStart)}
                        </p>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Users className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Active Students</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {dashboardData?.stats?.activeStudents ?? 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Currently enrolled</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {dashboardData?.stats?.upcomingSessions ?? 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">This week</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DollarSign className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Monthly</h3>
                            <p className="text-3xl font-bold text-purple-600">
                                {formatCurrency(parseFloat(dashboardData?.stats?.monthlyEarnings) || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">This month</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Total Earned</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {formatCurrency(parseFloat(dashboardData?.stats?.totalEarnings) || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">All time</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Star className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Rating</h3>
                            <p className="text-3xl font-bold text-yellow-600">
                                {(dashboardData?.stats?.overallRating || 0).toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {dashboardData?.stats?.totalSessions ?? 0} sessions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Recent Activity
                    </h2>
                    {dashboardData?.recentActivity?.length > 0 ? (
                        <div className="space-y-3">
                            {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{activity.title}</p>
                                        <p className="text-sm text-gray-600">
                                            {activity.student} • {activity.subject}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(activity.date)}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex flex-col items-end">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                            {activity.status.replace('_', ' ')}
                                        </span>
                                        {activity.amount && (
                                            <span className="text-sm font-medium text-green-600 mt-1">
                                                {formatCurrency(activity.amount)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-8">
                            No recent activity to show. Your completed sessions will appear here.
                        </p>
                    )}
                </div>

                {/* Recent Reviews */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="h-5 w-5 mr-2" />
                        Recent Reviews
                    </h2>
                    {dashboardData?.recentReviews?.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.recentReviews.map((review, index) => (
                                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-700">
                                                    {review.student}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-600 mb-1">"{review.comment}"</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {review.subject} • {formatDate(review.date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-8">
                            No reviews yet. Student reviews will appear here after completed sessions.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorDashboard;
