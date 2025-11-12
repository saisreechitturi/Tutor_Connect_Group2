import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Users, TrendingUp, TrendingDown, Star, BookOpen, Target, Award, AlertCircle } from 'lucide-react';
import { analyticsService } from '../services';
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
                
                const data = await analyticsService.getDashboardAnalytics(user.id, {
                    period: timeRange
                });
                
                setAnalyticsData(data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err.message || 'Failed to load analytics data');
                
                // Fallback to mock data for development
                setAnalyticsData({
        overview: {
            totalEarnings: 2450,
            totalHours: 54,
            totalStudents: 12,
            averageRating: 4.8,
            sessionsCompleted: 28,
            upcomingSessions: 5
        },
        earnings: {
            thisMonth: 2450,
            lastMonth: 2180,
            growth: 12.4,
            breakdown: [
                { month: 'May', amount: 1950 },
                { month: 'Jun', amount: 2180 },
                { month: 'Jul', amount: 2320 },
                { month: 'Aug', amount: 2450 },
                { month: 'Sep', amount: 2450 }
            ]
        },
        sessions: {
            completed: 28,
            cancelled: 2,
            noShow: 1,
            completionRate: 90.3,
            avgDuration: 1.2,
            totalHours: 54
        },
        students: {
            active: 12,
            inactive: 3,
            retention: 80,
            newThisMonth: 4,
            avgProgress: 76
        },
        subjects: [
            { name: 'JavaScript', sessions: 15, earnings: 675, avgRating: 4.9 },
            { name: 'React', sessions: 8, earnings: 360, avgRating: 4.8 },
            { name: 'Node.js', sessions: 5, earnings: 225, avgRating: 4.7 }
        ],
        recentSessions: [
            { id: 1, student: 'Sai Prathyusha Celoth', subject: 'React Hooks', date: '2024-09-12', duration: 1.5, rating: 5, earnings: 67.5 },
            { id: 2, student: 'Chandan Cheni', subject: 'Node.js APIs', date: '2024-09-11', duration: 1.0, rating: 5, earnings: 45 },
            { id: 3, student: 'Maatheswaran Kannan Chellapandian', subject: 'JavaScript Basics', date: '2024-09-10', duration: 1.0, rating: 4, earnings: 45 },
            { id: 4, student: 'Ananya Sharma', subject: 'React Components', date: '2024-09-09', duration: 2.0, rating: 5, earnings: 90 }
        ],
        performance: {
            punctuality: 95,
            preparedness: 92,
            communication: 98,
            knowledgeSharing: 96
        }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, timeRange]);

    const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendValue, color = 'primary' }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
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

    const EarningsChart = () => (
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
                                    style={{ width: `${(item.amount / 2500) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-16 text-right">${item.amount}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const SubjectBreakdown = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h3>
            <div className="space-y-4">
                {(analyticsData?.subjects || []).map((subject, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{subject.name}</h4>
                            <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm text-gray-600">{subject.avgRating}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Sessions</p>
                                <p className="font-medium">{subject.sessions}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Earnings</p>
                                <p className="font-medium">${subject.earnings}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const RecentSessions = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
            <div className="space-y-3">
                {(analyticsData?.recentSessions || []).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{session.student}</p>
                            <p className="text-sm text-gray-600">{session.subject}</p>
                            <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                                <Star className="h-3 w-3 text-yellow-400" />
                                <span className="text-sm text-gray-600">{session.rating}</span>
                            </div>
                            <p className="text-sm text-gray-600">{session.duration}h</p>
                            <p className="text-sm font-medium text-green-600">${session.earnings}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="btn-outline w-full mt-4">View All Sessions</button>
        </div>
    );

    const PerformanceMetrics = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
                {Object.entries(analyticsData?.performance || {}).map(([key, value]) => (
                    <div key={key}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm font-bold text-gray-900">{value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${value}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Loading state
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your tutoring performance and earnings</p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading analytics data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your tutoring performance and earnings</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-yellow-800 mb-2">Unable to Load Analytics</h3>
                            <p className="text-yellow-700 mb-4">{error}</p>
                            <p className="text-sm text-yellow-600 mb-4">Showing sample data for demonstration purposes. Real data will be available once connected to the backend.</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="btn-primary"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No data state
    if (!analyticsData) {
        return (
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your tutoring performance and earnings</p>
                </div>
                <div className="text-center py-12">
                    <p className="text-gray-600">No analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your tutoring performance and earnings</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    icon={DollarSign}
                    title="Total Earnings"
                    value={`$${analyticsData?.overview?.totalEarnings || 0}`}
                    subtitle="This month"
                    trend="up"
                    trendValue={analyticsData?.earnings?.growth || 0}
                    color="green"
                />
                <StatCard
                    icon={Clock}
                    title="Hours Tutored"
                    value={analyticsData?.overview?.totalHours || 0}
                    subtitle="This month"
                    color="blue"
                />
                <StatCard
                    icon={Users}
                    title="Active Students"
                    value={analyticsData?.overview?.totalStudents || 0}
                    subtitle={`${analyticsData?.students?.retention || 0}% retention rate`}
                    color="purple"
                />
                <StatCard
                    icon={Star}
                    title="Average Rating"
                    value={analyticsData?.overview?.averageRating || 0}
                    subtitle="Based on recent sessions"
                    color="yellow"
                />
                <StatCard
                    icon={BookOpen}
                    title="Sessions Completed"
                    value={analyticsData?.overview?.sessionsCompleted || 0}
                    subtitle={`${analyticsData?.sessions?.completionRate || 0}% completion rate`}
                    color="indigo"
                />
                <StatCard
                    icon={Target}
                    title="Upcoming Sessions"
                    value={analyticsData?.overview?.upcomingSessions || 0}
                    subtitle="Next 7 days"
                    color="pink"
                />
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <EarningsChart />
                </div>
                <div className="lg:col-span-1">
                    <SubjectBreakdown />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <RecentSessions />
                </div>
                <div className="lg:col-span-1">
                    <PerformanceMetrics />
                </div>
            </div>

            {/* Achievement Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                    <Award className="h-8 w-8" />
                    <h3 className="text-xl font-bold">Achievements</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="font-medium mb-1">Top Rated Tutor</h4>
                        <p className="text-sm text-primary-100">Maintained 4.8+ rating for 3 months</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="font-medium mb-1">Consistent Educator</h4>
                        <p className="text-sm text-primary-100">Completed 50+ sessions this quarter</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="font-medium mb-1">Student Favorite</h4>
                        <p className="text-sm text-primary-100">95% positive feedback rate</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorAnalytics;