import React, { useState, useEffect } from 'react';
import { adminService, sessionService } from '../services';
import {
    Calendar,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    MapPin,
    DollarSign,
    Star,
    Phone,
    Video,
    FileText,
    Eye,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

const AdminSessionManagement = () => {
    // Avatar helper functions
    const getUserInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const charCode = name ? name.charCodeAt(0) : 0;
        return colors[charCode % colors.length];
    };
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminService.getAllSessions();
            const sessionsData = response.sessions || [];

            // Transform API data to match expected format
            const transformedSessions = sessionsData.map(session => ({
                id: session.id,
                title: session.title,
                description: session.description,
                tutor_name: session.tutor.name,
                student_name: session.student.name,
                subject: session.subject,
                status: session.status,
                session_type: session.sessionType || 'video',
                scheduled_at: session.scheduledAt,
                scheduled_end: session.scheduledEnd,
                started_at: session.startedAt,
                ended_at: session.endedAt,
                duration: session.durationMinutes,
                actual_duration: session.actualDuration,
                total_earnings: session.paymentAmount || (session.rate ? session.rate * (session.durationMinutes / 60) : 0),
                tutor_earnings: session.paymentAmount ? session.paymentAmount * 0.8 : (session.rate ? session.rate * (session.durationMinutes / 60) * 0.8 : 0),
                rating: session.rating,
                notes: session.notes,
                homework_assigned: session.homeworkAssigned,
                materials_used: session.materialsUsed,
                meeting_link: session.meetingLink,
                meeting_room: session.meetingRoom,
                cancellation_reason: session.cancellationReason,
                location: session.meetingRoom || (session.sessionType === 'in_person' ? 'In-Person' : null),
                tutor_id: session.tutor.id,
                student_id: session.student.id,
                tutor: {
                    id: session.tutor.id,
                    name: session.tutor.name,
                    initial: getUserInitial(session.tutor.name),
                    avatarColor: getAvatarColor(session.tutor.name)
                },
                student: {
                    id: session.student.id,
                    name: session.student.name,
                    initial: getUserInitial(session.student.name),
                    avatarColor: getAvatarColor(session.student.name)
                },
                created_at: session.createdAt,
                updated_at: session.updatedAt
            }));

            setSessions(transformedSessions);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Failed to load sessions. Please try again.');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-red-800 font-medium">Error loading sessions</h3>
                        <p className="text-red-600 mt-1">{error}</p>
                        <button
                            onClick={fetchSessions}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Summary statistics
    const safeSessions = sessions || [];
    const stats = {
        totalSessions: safeSessions.length,
        completedSessions: safeSessions.filter(s => s.status === 'completed').length,
        scheduledSessions: safeSessions.filter(s => s.status === 'scheduled').length,
        cancelledSessions: safeSessions.filter(s => s.status === 'cancelled').length,
        totalEarnings: Number(safeSessions.reduce((sum, s) => sum + (parseFloat(s.total_earnings) || parseFloat(s.totalEarnings) || 0), 0)) || 0,
        averageRating: Number(safeSessions.filter(s => s.rating).reduce((sum, s, _, arr) => sum + (parseFloat(s.rating) || 0) / arr.length, 0)) || 0,
        totalDuration: Number(safeSessions.reduce((sum, s) => sum + (parseFloat(s.actual_duration) || parseFloat(s.actualDuration) || parseFloat(s.duration) || 0), 0)) || 0
    };

    // Filter sessions
    const filteredSessions = safeSessions.filter(session => {
        const tutorName = session.tutor_name || (session.tutor && session.tutor.name) || '';
        const studentName = session.student_name || (session.student && session.student.name) || '';
        const sessionId = session.id || '';
        const subject = session.subject || '';

        const matchesSearch = tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sessionId.toString().toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
        const matchesType = filterType === 'all' || session.session_type === filterType || session.type === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'scheduled': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'scheduled': return <Calendar className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'phone': return <Phone className="w-4 h-4" />;
            case 'in_person': return <MapPin className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openSessionModal = async (session) => {
        setSelectedSession(session);
        setShowModal(true);

        // Optionally fetch detailed session data using sessionService
        try {
            const detailedSession = await sessionService.getSession(session.id);
            setSelectedSession(detailedSession || session);
        } catch (error) {
            console.warn('Could not fetch detailed session data, using cached data:', error);
            // Keep using the session data we already have
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSession(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Management</h1>
                    <p className="text-gray-600">Oversee all tutoring sessions and monitor platform activity</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                                <p className="text-2xl font-semibold text-gray-900">${(stats.totalEarnings || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Star className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                                <p className="text-2xl font-semibold text-gray-900">{(stats.averageRating || 0).toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats.totalSessions > 0
                                        ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search sessions, tutors, students, or subjects..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setFilterStatus('all');
                                        setFilterType('all');
                                        setSearchTerm('');
                                    }}
                                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Reset all filters"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    <span>Reset</span>
                                </button>

                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>

                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="video">Video</option>
                                    <option value="phone">Phone</option>
                                    <option value="in_person">In Person</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="p-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                {[
                                    { key: 'all', label: 'All Sessions', count: stats.totalSessions },
                                    { key: 'completed', label: 'Completed', count: stats.completedSessions },
                                    { key: 'scheduled', label: 'Scheduled', count: stats.scheduledSessions }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Session Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Participants
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Schedule & Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status & Earnings
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSessions.filter(session => activeTab === 'all' || session.status === activeTab).map((session) => (
                                    <tr key={session.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 mr-3">
                                                    {getTypeIcon(session.session_type || session.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">#{session.id}</div>
                                                    <div className="text-sm text-gray-500">{session.subject || 'No Subject'}</div>
                                                    {session.location && (
                                                        <div className="text-sm text-gray-500">{session.location}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Tutor: {session.tutor?.name || session.tutor_name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Student: {session.student?.name || session.student_name || 'Unknown'}
                                                </div>
                                                {session.tutor?.rating && (
                                                    <div className="flex items-center mt-1">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-sm text-gray-500 ml-1">{session.tutor.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{formatDate(session.scheduled_at || session.scheduledTime)}</div>
                                            <div className="text-sm text-gray-500">
                                                {session.actual_duration || session.actualDuration ? `${session.actual_duration || session.actualDuration} min` : `${session.duration} min (scheduled)`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                    {getStatusIcon(session.status)}
                                                    <span className="ml-1 capitalize">{session.status}</span>
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-900 font-medium">${(parseFloat(session.total_earnings) || parseFloat(session.totalEarnings) || 0).toFixed(2)}</div>
                                            {session.rating && (
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-500 ml-1">{session.rating}/5</span>
                                                </div>
                                            )}
                                            {session.issues && Array.isArray(session.issues) && session.issues.length > 0 && (
                                                <div className="flex items-center mt-1">
                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs text-red-600 ml-1">{session.issues.length} issue(s)</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openSessionModal(session)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Session Detail Modal */}
                {showModal && selectedSession && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Session Details - {selectedSession.id}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Basic Info */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Session Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Subject:</span>
                                                <span className="font-medium">{selectedSession.subject}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Type:</span>
                                                <div className="flex items-center">
                                                    {getTypeIcon(selectedSession.session_type || selectedSession.type)}
                                                    <span className="ml-2 capitalize">{selectedSession.session_type || selectedSession.type || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Status:</span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                                                    {getStatusIcon(selectedSession.status)}
                                                    <span className="ml-1 capitalize">{selectedSession.status}</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Location:</span>
                                                <span className="font-medium">{selectedSession.location || 'Online'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Participants</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="font-medium text-gray-900">Tutor: {selectedSession.tutor?.name || selectedSession.tutor_name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">ID: {selectedSession.tutor?.id || selectedSession.tutor_id || 'N/A'}</div>
                                                {selectedSession.tutor?.rating && (
                                                    <div className="flex items-center mt-1">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-sm text-gray-500 ml-1">{selectedSession.tutor.rating} rating</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Student: {selectedSession.student.name}</div>
                                                <div className="text-sm text-gray-500">ID: {selectedSession.student.id}</div>
                                                <div className="text-sm text-gray-500">{selectedSession.student.grade}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Timing & Earnings</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Scheduled:</span>
                                                <span className="font-medium">{formatDate(selectedSession.scheduledTime)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Duration:</span>
                                                <span className="font-medium">
                                                    {selectedSession.actual_duration || selectedSession.actualDuration
                                                        ? `${selectedSession.actual_duration || selectedSession.actualDuration} min (actual)`
                                                        : `${selectedSession.duration} min (scheduled)`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Rate:</span>
                                                <span className="font-medium">${selectedSession.rate || 'N/A'}/hour</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Total Earnings:</span>
                                                <span className="font-medium text-green-600">${(parseFloat(selectedSession.total_earnings) || parseFloat(selectedSession.totalEarnings) || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Details */}
                                <div className="space-y-6">
                                    {selectedSession.notes && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Session Notes</h4>
                                            <p className="text-gray-700">{selectedSession.notes}</p>
                                        </div>
                                    )}

                                    {selectedSession.rating && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Session Rating</h4>
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${i < selectedSession.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                                <span className="ml-2 text-lg font-medium">{selectedSession.rating}/5</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedSession.resources && Array.isArray(selectedSession.resources) && selectedSession.resources.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Session Resources</h4>
                                            <div className="space-y-2">
                                                {selectedSession.resources.map((resource, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                                        <span className="text-gray-700">{resource}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedSession.issues && Array.isArray(selectedSession.issues) && selectedSession.issues.length > 0 && (
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                                                <AlertTriangle className="w-5 h-5 mr-2" />
                                                Session Issues
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedSession.issues.map((issue, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                                                        <span className="text-red-700">{issue}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSessionManagement;