import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorService, sessionService } from '../services';
import {
    Search, Filter, MessageCircle, Calendar, BookOpen, Star, Clock,
    TrendingUp, Award, X, User, Calendar as CalendarIcon
} from 'lucide-react';

const TutorStudents = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [studentSessions, setStudentSessions] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [user?.id]);

    const fetchStudents = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await tutorService.getTutorStudents(user.id);
            if (response && response.students) {
                // Enhance student data with computed fields
                const enhancedStudents = response.students.map(student => ({
                    ...student,
                    name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                    status: student.totalSessions > 0 ? 'active' : 'inactive',
                    progress: Math.min(100, Math.max(0, (student.completedSessions / Math.max(1, student.totalSessions)) * 100)),
                    hoursLearned: Math.round((student.totalSessions * 1.5) * 10) / 10, // Estimate 1.5 hours per session
                    subjects: [], // Will be populated from session data if needed
                    avatar: student.avatarUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
                }));
                setStudents(enhancedStudents);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetails = async (studentId) => {
        try {
            // Fetch student's sessions with this tutor
            const sessionsResponse = await sessionService.getSessions();
            const studentSessionsData = sessionsResponse?.filter(session =>
                session.student_id === studentId && session.tutor_id === user.id
            ) || [];
            setStudentSessions(studentSessionsData);
        } catch (error) {
            console.error('Error fetching student details:', error);
        }
    };

    const filteredStudents = students.filter(student => {
        const studentName = student.name || '';
        const email = student.email || '';
        const subjects = student.subjects || [];

        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterStatus === 'all' || student.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    const handleViewStudent = async (student) => {
        setSelectedStudent(student);
        await fetchStudentDetails(student.id);
        setShowDetailModal(true);
    };

    const handleMessage = (student) => {
        alert(`Messaging ${student.name}. This will be integrated with the messaging system.`);
    };

    const handleSchedule = (student) => {
        alert(`Scheduling session with ${student.name}. This will be integrated with the calendar system.`);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg p-6">
                                    <div className="h-16 bg-gray-200 rounded-full w-16 mx-auto mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-red-800 font-medium">Error loading students</h3>
                        <p className="text-red-600 mt-1">{error}</p>
                        <button
                            onClick={fetchStudents}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const StudentCard = ({ student }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewStudent(student)}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <img
                        src={student.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'}
                        alt={student.name || 'Student'}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-medium text-gray-900">{student.name || 'Unknown Student'}</h3>
                        <p className="text-sm text-gray-500">{student.email || 'No email'}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(student.status || 'inactive')}`}>
                            {student.status || 'inactive'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {student.avgRating ? Math.round(student.avgRating * 10) / 10 : 'N/A'}
                    </div>
                    <p className="text-xs text-gray-400">Avg Rating</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{student.totalSessions || 0}</p>
                    <p className="text-xs text-gray-500">Total Sessions</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{Math.round(student.progress || 0)}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{student.hoursLearned || 0}h</p>
                    <p className="text-xs text-gray-500">Hours Learned</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                    {(student.subjects || []).length > 0 ? (
                        student.subjects.map((subject, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {subject}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-gray-400">No subjects yet</span>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                    Last session: {student.lastSession ? new Date(student.lastSession).toLocaleDateString() : 'Never'}
                </span>
                <div className="flex space-x-2">
                    <button
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMessage(student);
                        }}
                        title="Send message"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSchedule(student);
                        }}
                        title="Schedule session"
                    >
                        <Calendar className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const StudentDetailModal = ({ student, onClose }) => {
        const [activeTab, setActiveTab] = useState('overview');

        const getRecentSessions = () => {
            return studentSessions
                .sort((a, b) => new Date(b.scheduled_start || b.session_date) - new Date(a.scheduled_start || a.session_date))
                .slice(0, 5)
                .map(session => ({
                    ...session,
                    date: session.scheduled_start || session.session_date,
                    status: session.status || 'completed',
                    subject: session.title || 'Session',
                    duration: session.duration_minutes || 60
                }));
        };

        const getSessionStatusColor = (status) => {
            switch (status) {
                case 'completed': return 'bg-green-100 text-green-800';
                case 'scheduled': return 'bg-blue-100 text-blue-800';
                case 'cancelled': return 'bg-red-100 text-red-800';
                case 'in_progress': return 'bg-yellow-100 text-yellow-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        if (!student) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}>
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <img
                                    src={student.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'}
                                    alt={student.name || 'Student'}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{student.name || 'Unknown Student'}</h2>
                                    <p className="text-gray-600">{student.email || 'No email'}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status || 'inactive')}`}>
                                            {student.status || 'inactive'}
                                        </span>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                            {student.avgRating ? Math.round(student.avgRating * 10) / 10 : 'N/A'} avg rating
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleMessage(student)}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>Message</span>
                                </button>
                                <button
                                    onClick={() => handleSchedule(student)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                    <Calendar className="h-4 w-4" />
                                    <span>Schedule</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: 'overview', label: 'Overview', icon: User },
                                { id: 'sessions', label: 'Sessions', icon: CalendarIcon },
                                { id: 'progress', label: 'Progress', icon: TrendingUp }
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === tab.id
                                                ? 'border-primary-500 text-primary-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Stats Cards */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <BookOpen className="h-8 w-8 text-blue-600" />
                                                <div className="ml-3">
                                                    <p className="text-2xl font-bold text-blue-600">{student.totalSessions || 0}</p>
                                                    <p className="text-sm text-blue-600">Total Sessions</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <TrendingUp className="h-8 w-8 text-green-600" />
                                                <div className="ml-3">
                                                    <p className="text-2xl font-bold text-green-600">{Math.round(student.progress || 0)}%</p>
                                                    <p className="text-sm text-green-600">Progress</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <Clock className="h-8 w-8 text-purple-600" />
                                                <div className="ml-3">
                                                    <p className="text-2xl font-bold text-purple-600">{student.hoursLearned || 0}h</p>
                                                    <p className="text-sm text-purple-600">Hours Learned</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <Award className="h-8 w-8 text-yellow-600" />
                                                <div className="ml-3">
                                                    <p className="text-2xl font-bold text-yellow-600">{student.avgRating ? Math.round(student.avgRating * 10) / 10 : 'N/A'}</p>
                                                    <p className="text-sm text-yellow-600">Avg Rating</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600">{student.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600">
                                                Last session: {student.lastSession ? new Date(student.lastSession).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                        {student.subjects && student.subjects.length > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Subjects:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {student.subjects.map((subject, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                            {subject}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session History</h3>

                                    {getRecentSessions().length > 0 ? (
                                        <div className="space-y-3">
                                            {getRecentSessions().map((session, index) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{session.subject}</h4>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(session.date).toLocaleDateString()} • {session.duration} minutes
                                                            </p>
                                                            {session.session_notes && (
                                                                <p className="text-sm text-gray-500 mt-1">{session.session_notes}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                                                                {session.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No sessions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Progress</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-blue-600">{student.completedSessions || 0}</div>
                                            <div className="text-sm text-gray-600">Completed Sessions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-green-600">{Math.round(student.progress || 0)}%</div>
                                            <div className="text-sm text-gray-600">Overall Progress</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-purple-600">{student.hoursLearned || 0}h</div>
                                            <div className="text-sm text-gray-600">Total Hours</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Chart Placeholder */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-medium text-gray-900 mb-4">Performance Over Time</h4>
                                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Progress chart will be implemented with session data</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
                    <p className="text-gray-600 mt-1">Manage your students and track their progress</p>
                </div>
                <div className="text-sm text-gray-500">
                    {filteredStudents.length} students
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search students by name, email, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-[120px]"
                        >
                            <option value="all">All Students</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                ))}
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <BookOpen className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-500">
                        {students.length === 0
                            ? "You don't have any students yet. Students will appear here after they book sessions with you."
                            : "Try adjusting your search or filter criteria."
                        }
                    </p>
                </div>
            )}

            {/* Student Detail Modal */}
            {showDetailModal && selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedStudent(null);
                    }}
                />
            )}
        </div>
    );
};

export default TutorStudents;