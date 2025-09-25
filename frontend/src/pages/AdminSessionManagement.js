import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MessageSquare,
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
    TrendingUp,
    Activity
} from 'lucide-react';

const AdminSessionManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Mock session data
    const sessions = [
        {
            id: 'SES001',
            tutor: { name: 'Dr. Sarah Johnson', id: 'TUT001', rating: 4.9 },
            student: { name: 'Alex Chen', id: 'STU001', grade: '10th Grade' },
            subject: 'Advanced Mathematics',
            status: 'completed',
            type: 'video',
            scheduledTime: '2024-01-15 14:00',
            duration: 60,
            actualDuration: 58,
            rate: 45,
            totalEarnings: 45,
            location: 'Online',
            notes: 'Great progress on calculus derivatives',
            rating: 5,
            issues: [],
            resources: ['calculus_notes.pdf', 'practice_problems.pdf']
        },
        {
            id: 'SES002',
            tutor: { name: 'Michael Rodriguez', id: 'TUT002', rating: 4.7 },
            student: { name: 'Emma Wilson', id: 'STU001', grade: '12th Grade' },
            subject: 'Physics',
            status: 'in-progress',
            type: 'in-person',
            scheduledTime: '2024-01-15 16:00',
            duration: 90,
            actualDuration: 45,
            rate: 50,
            totalEarnings: 37.5,
            location: 'Central Library, Room 204',
            notes: 'Working on quantum mechanics concepts',
            rating: null,
            issues: [],
            resources: ['quantum_physics_guide.pdf']
        },
        {
            id: 'SES004',
            tutor: { name: 'Lisa Anderson', id: 'TUT004', rating: 4.9 },
            student: { name: 'Sophie Davis', id: 'STU003', grade: '9th Grade' },
            subject: 'English Literature',
            status: 'scheduled',
            type: 'in-person',
            scheduledTime: '2024-01-16 15:30',
            duration: 75,
            actualDuration: null,
            rate: 35,
            totalEarnings: 43.75,
            location: 'Student\'s Home',
            notes: 'First session - Shakespeare introduction',
            rating: null,
            issues: [],
            resources: []
        },
        {
            id: 'SES005',
            tutor: { name: 'Dr. Sarah Johnson', id: 'TUT001', rating: 4.9 },
            student: { name: 'James Miller', id: 'STU004', grade: '12th Grade' },
            subject: 'Calculus',
            status: 'cancelled',
            type: 'video',
            scheduledTime: '2024-01-14 13:00',
            duration: 60,
            actualDuration: 0,
            rate: 45,
            totalEarnings: 0,
            location: 'Online',
            notes: 'Student cancelled 2 hours before session',
            rating: null,
            issues: ['Late cancellation'],
            resources: []
        },
        {
            id: 'SES006',
            tutor: { name: 'Michael Rodriguez', id: 'TUT002', rating: 4.7 },
            student: { name: 'Isabella Garcia', id: 'STU005', grade: '10th Grade' },
            subject: 'Biology',
            status: 'completed',
            type: 'phone',
            scheduledTime: '2024-01-14 17:00',
            duration: 45,
            actualDuration: 47,
            rate: 50,
            totalEarnings: 39.17,
            location: 'Phone Call',
            notes: 'Reviewed cell biology and mitosis',
            rating: 4,
            issues: [],
            resources: ['cell_biology_diagram.png', 'mitosis_worksheet.pdf']
        }
    ];

    // Summary statistics
    const stats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        inProgressSessions: sessions.filter(s => s.status === 'in-progress').length,
        scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
        cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
        totalEarnings: sessions.reduce((sum, s) => sum + s.totalEarnings, 0),
        averageRating: sessions.filter(s => s.rating).reduce((sum, s, _, arr) => sum + s.rating / arr.length, 0),
        totalDuration: sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0)
    };

    // Filter sessions
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
        const matchesType = filterType === 'all' || session.type === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'scheduled': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'in-progress': return <Activity className="w-4 h-4" />;
            case 'scheduled': return <Calendar className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'phone': return <Phone className="w-4 h-4" />;
            case 'in-person': return <MapPin className="w-4 h-4" />;
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

    const openSessionModal = (session) => {
        setSelectedSession(session);
        setShowModal(true);
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
                                <p className="text-2xl font-semibold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
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
                                <p className="text-2xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</p>
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
                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="in-progress">In Progress</option>
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
                                    <option value="in-person">In Person</option>
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
                                    { key: 'in-progress', label: 'In Progress', count: stats.inProgressSessions },
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
                                                    {getTypeIcon(session.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{session.id}</div>
                                                    <div className="text-sm text-gray-500">{session.subject}</div>
                                                    <div className="text-sm text-gray-500">{session.location}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Tutor: {session.tutor.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Student: {session.student.name} ({session.student.grade})
                                                </div>
                                                {session.tutor.rating && (
                                                    <div className="flex items-center mt-1">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-sm text-gray-500 ml-1">{session.tutor.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{formatDate(session.scheduledTime)}</div>
                                            <div className="text-sm text-gray-500">
                                                {session.actualDuration ? `${session.actualDuration} min` : `${session.duration} min (scheduled)`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                    {getStatusIcon(session.status)}
                                                    <span className="ml-1 capitalize">{session.status}</span>
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-900 font-medium">${session.totalEarnings.toFixed(2)}</div>
                                            {session.rating && (
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-500 ml-1">{session.rating}/5</span>
                                                </div>
                                            )}
                                            {session.issues.length > 0 && (
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
                                                    {getTypeIcon(selectedSession.type)}
                                                    <span className="ml-2 capitalize">{selectedSession.type}</span>
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
                                                <span className="font-medium">{selectedSession.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Participants</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="font-medium text-gray-900">Tutor: {selectedSession.tutor.name}</div>
                                                <div className="text-sm text-gray-500">ID: {selectedSession.tutor.id}</div>
                                                <div className="flex items-center mt-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-500 ml-1">{selectedSession.tutor.rating} rating</span>
                                                </div>
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
                                                    {selectedSession.actualDuration
                                                        ? `${selectedSession.actualDuration} min (actual)`
                                                        : `${selectedSession.duration} min (scheduled)`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Rate:</span>
                                                <span className="font-medium">${selectedSession.rate}/hour</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Total Earnings:</span>
                                                <span className="font-medium text-green-600">${selectedSession.totalEarnings.toFixed(2)}</span>
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

                                    {selectedSession.resources.length > 0 && (
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

                                    {selectedSession.issues.length > 0 && (
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

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <MessageSquare className="w-4 h-4 inline mr-2" />
                                    Contact Participants
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