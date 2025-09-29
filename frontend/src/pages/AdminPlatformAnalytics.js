import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    BookOpen,
    Clock,
    Star,
    Calendar,
    ArrowUp,
    ArrowDown,
    Target,
    Award,
    Activity,
    BarChart3,
    PieChart,
    Download,
    Filter,
    RefreshCw,
    Eye,
    UserCheck,
    MessageSquare,
    Shield
} from 'lucide-react';

const AdminPlatformAnalytics = () => {
    const { user } = useAuth();
    const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getStats();
            setStats(response);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to load analytics data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Process stats data into the format expected by the UI
    const processStatsData = () => {
        if (!stats) return null;

        // Calculate user totals and changes (using mock change data for now)
        const activeStudents = stats.userStats.find(s => s.role === 'student' && s.is_active)?.count || 0;
        const activeTutors = stats.userStats.find(s => s.role === 'tutor' && s.is_active)?.count || 0;
        const activeAdmins = stats.userStats.find(s => s.role === 'admin' && s.is_active)?.count || 0;
        const totalActiveUsers = activeStudents + activeTutors + activeAdmins;

        // Calculate session totals
        const totalSessions = stats.sessionStats.reduce((sum, s) => sum + parseInt(s.count), 0);
        const completedSessions = stats.sessionStats.find(s => s.status === 'completed')?.count || 0;
        const totalRevenue = stats.sessionStats.find(s => s.status === 'completed')?.total_revenue || 0;
        const avgRate = stats.sessionStats.find(s => s.status === 'completed')?.avg_rate || 0;
        const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

        return {
            totalUsers: { current: totalActiveUsers, previous: Math.floor(totalActiveUsers * 0.9), change: 10 },
            activeUsers: { current: totalActiveUsers, previous: Math.floor(totalActiveUsers * 0.92), change: 8 },
            totalSessions: { current: totalSessions, previous: Math.floor(totalSessions * 0.88), change: 12 },
            revenue: { current: parseFloat(totalRevenue) || 0, previous: Math.floor(parseFloat(totalRevenue) * 0.85) || 0, change: 15 },
            avgSessionRating: { current: 4.7, previous: 4.6, change: 2.17 }, // This would need session_reviews table
            completionRate: { current: completionRate, previous: completionRate * 0.95, change: 5 }
        };
    };

    const overviewStats = processStatsData();

    // If still loading or error, show appropriate state
    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
                    <span className="ml-2 text-gray-600">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Shield className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchStats}
                                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!overviewStats) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">No analytics data available</div>
            </div>
        );
    }

    // Mock analytics data (keeping the existing structure for remaining mock data - userGrowthData etc.)

    const userGrowthData = [
        { month: 'Jan', students: 145, tutors: 23, total: 168 },
        { month: 'Feb', students: 162, tutors: 28, total: 190 },
        { month: 'Mar', students: 178, tutors: 31, total: 209 },
        { month: 'Apr', students: 195, tutors: 35, total: 230 },
        { month: 'May', students: 212, tutors: 38, total: 250 },
        { month: 'Jun', students: 228, tutors: 42, total: 270 }
    ];

    const revenueData = [
        { month: 'Jan', revenue: 28450, sessions: 1245, avgPerSession: 22.85 },
        { month: 'Feb', revenue: 31200, sessions: 1356, avgPerSession: 23.01 },
        { month: 'Mar', revenue: 33800, sessions: 1467, avgPerSession: 23.05 },
        { month: 'Apr', revenue: 36200, sessions: 1578, avgPerSession: 22.94 },
        { month: 'May', revenue: 39650, sessions: 1689, avgPerSession: 23.47 },
        { month: 'Jun', revenue: 42100, sessions: 1801, avgPerSession: 23.38 }
    ];

    const subjectDistribution = [
        { subject: 'Mathematics', sessions: 856, percentage: 24.8, revenue: 19234.50 },
        { subject: 'Science', sessions: 623, percentage: 18.0, revenue: 14567.25 },
        { subject: 'English', sessions: 545, percentage: 15.8, revenue: 11890.00 },
        { subject: 'History', sessions: 432, percentage: 12.5, revenue: 9876.75 },
        { subject: 'Languages', sessions: 398, percentage: 11.5, revenue: 8654.25 },
        { subject: 'Arts', sessions: 287, percentage: 8.3, revenue: 6234.50 },
        { subject: 'Other', sessions: 315, percentage: 9.1, revenue: 7221.25 }
    ];

    const topPerformers = {
        tutors: stats?.topTutors?.map(tutor => ({
            name: tutor.name,
            sessions: tutor.totalSessions || 0,
            rating: tutor.rating || 0,
            earnings: tutor.totalSessions * 50 || 0, // Estimate earnings
            subjects: ['Various'] // Could be enhanced with real subjects data
        })) || [
                { name: 'No tutors available', sessions: 0, rating: 0, earnings: 0, subjects: [] }
            ],
        students: [
            // Mock data for students since we don't have this in backend yet
            { name: 'Demo Student', sessions: 2, subjects: 1, avgRating: 4.8, totalSpent: 125.00 }
        ]
    };

    const platformHealth = {
        systemUptime: 99.7,
        avgResponseTime: 142,
        activeConnections: 234,
        errorRate: 0.3,
        supportTickets: { open: 12, resolved: 89, avgResolutionTime: 4.2 },
        contentModeration: { flagged: 3, reviewed: 15, approved: 12 },
        securityIncidents: 0
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value, showSign = true) => {
        const sign = showSign && value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const StatCard = ({ title, value, change, icon: Icon, format = 'number' }) => {
        const isPositive = change > 0;
        let formattedValue = value;

        if (format === 'currency') {
            formattedValue = formatCurrency(value);
        } else if (format === 'percentage') {
            formattedValue = formatPercentage(value, false);
        } else if (format === 'number') {
            formattedValue = value.toLocaleString();
        }

        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-2xl font-semibold text-gray-900">{formattedValue}</p>
                        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            <span className="ml-1">{formatPercentage(Math.abs(change))} vs last period</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
                            <p className="text-gray-600">Comprehensive insights into platform performance and user behavior</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedTimeframe}
                                onChange={(e) => setSelectedTimeframe(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                            </select>
                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </button>
                            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overview Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Users"
                        value={overviewStats.totalUsers.current}
                        change={overviewStats.totalUsers.change}
                        icon={Users}
                    />
                    <StatCard
                        title="Active Users"
                        value={overviewStats.activeUsers.current}
                        change={overviewStats.activeUsers.change}
                        icon={UserCheck}
                    />
                    <StatCard
                        title="Total Sessions"
                        value={overviewStats.totalSessions.current}
                        change={overviewStats.totalSessions.change}
                        icon={BookOpen}
                    />
                    <StatCard
                        title="Platform Revenue"
                        value={overviewStats.revenue.current}
                        change={overviewStats.revenue.change}
                        icon={DollarSign}
                        format="currency"
                    />
                    <StatCard
                        title="Avg Session Rating"
                        value={overviewStats.avgSessionRating.current}
                        change={overviewStats.avgSessionRating.change}
                        icon={Star}
                        format="rating"
                    />
                    <StatCard
                        title="Completion Rate"
                        value={overviewStats.completionRate.current}
                        change={overviewStats.completionRate.change}
                        icon={Target}
                        format="percentage"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* User Growth Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                                    <span className="text-sm text-gray-600">Students</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                                    <span className="text-sm text-gray-600">Tutors</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {userGrowthData.map((data) => (
                                <div key={data.month} className="flex items-center">
                                    <div className="w-12 text-sm text-gray-500">{data.month}</div>
                                    <div className="flex-1 ml-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                                <div
                                                    className="bg-blue-500 h-6 rounded-full"
                                                    style={{ width: `${(data.students / data.total) * 100}%` }}
                                                ></div>
                                                <div
                                                    className="bg-green-500 h-6 rounded-r-full absolute top-0"
                                                    style={{
                                                        left: `${(data.students / data.total) * 100}%`,
                                                        width: `${(data.tutors / data.total) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-12">{data.total}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            {revenueData.map((data) => (
                                <div key={data.month} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-12 text-sm text-gray-500">{data.month}</div>
                                        <div className="ml-4 flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(data.revenue)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {data.sessions} sessions • {formatCurrency(data.avgPerSession)}/session
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(data.revenue / 45000) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subject Distribution & Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Subject Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Subject Distribution</h3>
                            <PieChart className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            {subjectDistribution.map((subject) => (
                                <div key={subject.subject} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded mr-3`} style={{ backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)` }}></div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{subject.subject}</div>
                                            <div className="text-xs text-gray-500">{subject.sessions} sessions</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">{subject.percentage}%</div>
                                        <div className="text-xs text-gray-500">{formatCurrency(subject.revenue)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Performing Tutors */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Top Performing Tutors</h3>
                            <Award className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            {topPerformers.tutors.slice(0, 5).map((tutor, index) => (
                                <div key={tutor.name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {tutor.sessions} sessions • {tutor.subjects.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm font-medium text-gray-900 ml-1">{tutor.rating}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{formatCurrency(tutor.earnings)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Platform Health & Top Students */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Platform Health */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Platform Health</h3>
                            <Activity className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <div className="ml-2">
                                        <div className="text-sm font-medium text-green-900">System Uptime</div>
                                        <div className="text-lg font-bold text-green-600">{platformHealth.systemUptime}%</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <div className="ml-2">
                                        <div className="text-sm font-medium text-blue-900">Response Time</div>
                                        <div className="text-lg font-bold text-blue-600">{platformHealth.avgResponseTime}ms</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                                    <div className="ml-2">
                                        <div className="text-sm font-medium text-yellow-900">Support Tickets</div>
                                        <div className="text-lg font-bold text-yellow-600">{platformHealth.supportTickets.open} open</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <Eye className="w-5 h-5 text-purple-600" />
                                    <div className="ml-2">
                                        <div className="text-sm font-medium text-purple-900">Active Sessions</div>
                                        <div className="text-lg font-bold text-purple-600">{platformHealth.activeConnections}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Error Rate</span>
                                <span className="font-medium text-gray-900">{platformHealth.errorRate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Avg Resolution Time</span>
                                <span className="font-medium text-gray-900">{platformHealth.supportTickets.avgResolutionTime}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Security Incidents</span>
                                <span className="font-medium text-green-600">{platformHealth.securityIncidents}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Students */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Most Active Students</h3>
                            <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            {topPerformers.students.map((student, index) => (
                                <div key={student.name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                                            {index + 1}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {student.sessions} sessions • {student.subjects} subjects
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm font-medium text-gray-900 ml-1">{student.avgRating}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{formatCurrency(student.totalSpent)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Additional Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">User Engagement</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Daily Active Users</span>
                                    <span className="font-medium">892</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Weekly Active Users</span>
                                    <span className="font-medium">1,156</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Monthly Active Users</span>
                                    <span className="font-medium">1,247</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Avg Session Duration</span>
                                    <span className="font-medium">47 min</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Financial Metrics</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Gross Revenue</span>
                                    <span className="font-medium">{formatCurrency(45678.50)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Platform Commission</span>
                                    <span className="font-medium">{formatCurrency(6851.78)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Avg Revenue per User</span>
                                    <span className="font-medium">{formatCurrency(36.64)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Churn Rate</span>
                                    <span className="font-medium">5.2%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Quality Metrics</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Avg Tutor Rating</span>
                                    <span className="font-medium">4.7/5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Session Completion Rate</span>
                                    <span className="font-medium">94.2%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Student Satisfaction</span>
                                    <span className="font-medium">4.6/5</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlatformAnalytics;