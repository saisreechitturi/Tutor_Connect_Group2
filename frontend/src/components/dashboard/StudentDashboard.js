import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sessionService, taskService } from '../../services';
import { Calendar, CheckSquare, BookOpen, Clock, TrendingUp } from 'lucide-react';
import AddTaskModal from '../modals/AddTaskModal';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user sessions and tasks
                const [sessionsData, tasksData] = await Promise.all([
                    sessionService.getSessions({ role: 'student' }),
                    taskService.getTasks()
                ]);

                setSessions(sessionsData);
                setTasks(tasksData);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id]);

    const handleTaskAdded = (newTask) => {
        setTasks(prev => [...prev, newTask]);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/20 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="animate-pulse">
                                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Calculate stats
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const upcomingEvents = 0; // Calendar events will be implemented later
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    const stats = [
        {
            name: 'Upcoming Sessions',
            value: upcomingSessions,
            icon: BookOpen,
            color: 'blue',
            description: 'Scheduled tutoring sessions'
        },
        {
            name: 'Pending Tasks',
            value: pendingTasks,
            icon: CheckSquare,
            color: 'yellow',
            description: 'Tasks to complete'
        },
        {
            name: 'Upcoming Events',
            value: upcomingEvents,
            icon: Calendar,
            color: 'green',
            description: 'Calendar events and deadlines'
        },
        {
            name: 'Completed Tasks',
            value: completedTasks,
            icon: TrendingUp,
            color: 'purple',
            description: 'Tasks completed this week'
        }
    ];

    const recentSessions = sessions
        .filter(s => (s.status === 'scheduled' || s.actualStatus === 'scheduled') && (s.scheduledStart || s.scheduled_start))
        .sort((a, b) => new Date(a.scheduledStart || a.scheduled_start) - new Date(b.scheduledStart || b.scheduled_start))
        .slice(0, 3);

    const urgentTasks = tasks
        .filter(t => t.status !== 'completed')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold">
                    Welcome back, {user?.firstName || user?.profile?.firstName || 'Student'}!
                </h1>
                <p className="mt-2 text-primary-100">
                    Ready to continue your learning journey? Check out your upcoming sessions and tasks below.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/student/tutors')}
                        className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <BookOpen className="h-5 w-5 mr-2" />
                        Book Session
                    </button>
                    <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <CheckSquare className="h-5 w-5 mr-2" />
                        Add Task
                    </button>
                    <button
                        onClick={() => navigate('/student/tutors')}
                        className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Find Tutors
                    </button>
                    <button
                        onClick={() => navigate('/student/calendar')}
                        className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Calendar className="h-5 w-5 mr-2" />
                        View Calendar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-200',
                        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
                        green: 'bg-green-50 text-green-600 border-green-200',
                        purple: 'bg-purple-50 text-purple-600 border-purple-200'
                    };

                    return (
                        <div key={stat.name} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">{stat.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Sessions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                            Upcoming Sessions
                        </h2>
                    </div>
                    <div className="p-6">
                        {recentSessions.length > 0 ? (
                            <div className="space-y-4">
                                {recentSessions.map((session) => {
                                    const sessionDate = new Date(session.scheduledStart || session.scheduled_start);
                                    const sessionEndDate = new Date(session.scheduledEnd || session.scheduled_end);
                                    const duration = sessionEndDate && sessionDate ?
                                        Math.round((sessionEndDate - sessionDate) / (1000 * 60)) :
                                        session.durationMinutes || 60;

                                    return (
                                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {session.title || session.subject || 'Tutoring Session'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {sessionDate.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })} at {sessionDate.toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {duration}min
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No upcoming sessions</p>
                                <button
                                    onClick={() => navigate('/student/tutors')}
                                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    Book a session
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Urgent Tasks */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <CheckSquare className="h-5 w-5 mr-2 text-primary-600" />
                            Urgent Tasks
                        </h2>
                    </div>
                    <div className="p-6">
                        {urgentTasks.length > 0 ? (
                            <div className="space-y-4">
                                {urgentTasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                                            {task.tags && task.tags.length > 0 && (
                                                <p className="text-sm text-gray-600">{task.tags.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                Due: {new Date(task.due_date).toLocaleDateString()}
                                            </p>
                                            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {task.priority} priority
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">All caught up!</p>
                                <p className="text-sm text-gray-400 mt-1">No urgent tasks at the moment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                onTaskAdded={handleTaskAdded}
            />
        </div>
    );
};

export default StudentDashboard;