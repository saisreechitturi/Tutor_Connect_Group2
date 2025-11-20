import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Users, TrendingUp, Star, BookOpen, Target, RefreshCw } from 'lucide-react';
import tutorService from '../services/tutorService';
import { useAuth } from '../context/AuthContext';

const TutorAnalytics = () => {
    const [timeRange, setTimeRange] = useState('month');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Fetch analytics data when component mounts or timeRange changes
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.id) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const data = await tutorService.getTutorAnalytics(user.id, {
                    period: timeRange
                });

                setAnalyticsData(data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err.message || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.id, timeRange]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const handleRefresh = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            await tutorService.refreshStatistics(user.id);
            // Refetch analytics data after refresh
            const data = await tutorService.getTutorAnalytics(user.id, {
                period: timeRange
            });
            setAnalyticsData(data);
        } catch (err) {
            console.error('Error refreshing analytics:', err);
            setError('Failed to refresh analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {trendValue}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );

    const overview = analyticsData?.overview || {};

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your tutoring performance and earnings</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Earnings"
                    value={formatCurrency(overview.totalEarnings)}
                    subtitle="All time"
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Hours Tutored"
                    value={`${(overview.totalHours || 0).toFixed(1)}`}
                    subtitle="All time"
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Active Students"
                    value={overview.activeStudents || 0}
                    subtitle={`0% retention rate`}
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="Average Rating"
                    value={(overview.averageRating || 0).toFixed(1)}
                    subtitle="Based on recent sessions"
                    icon={Star}
                    color="yellow"
                />
                <StatCard
                    title="Sessions Completed"
                    value={overview.sessionsCompleted || 0}
                    subtitle="0% completion rate"
                    icon={BookOpen}
                    color="indigo"
                />
                <StatCard
                    title="Upcoming Sessions"
                    value={overview.upcomingSessions || 0}
                    subtitle="Next 7 days"
                    icon={Target}
                    color="pink"
                />
            </div>

            {/* This Month Stats */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">This Month Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(overview.monthlyEarnings)}
                        </p>
                        <p className="text-sm text-gray-600">Monthly Earnings</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {(overview.monthlyHours || 0).toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-600">Hours Tutored</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                            {overview.monthlySessionsCompleted || 0}
                        </p>
                        <p className="text-sm text-gray-600">Sessions Completed</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Overview Chart */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Earnings Overview</h3>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="input-field text-sm py-1"
                                >
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(analyticsData?.earnings?.breakdown || []).map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{item.month}</span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full"
                                                style={{ width: `${Math.max((item.amount / Math.max(...(analyticsData?.earnings?.breakdown || []).map(i => i.amount), 1)) * 100, 5)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
                        <div className="space-y-3">
                            {(analyticsData?.recentSessions || []).map((session, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{session.title}</p>
                                        <p className="text-sm text-gray-600">{session.student} • {session.subject}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(session.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            {formatCurrency(session.amount)}
                                        </p>
                                        <p className={`text-xs px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {session.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-outline w-full mt-4">
                            View All Sessions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorAnalytics;