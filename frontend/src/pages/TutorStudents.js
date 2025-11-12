import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorService, sessionService } from '../services';
import { Search, Filter, MessageCircle, Calendar, BookOpen, Star, Clock, TrendingUp, Award } from 'lucide-react';

// Mock data for students
const mockStudents = [
    {
        id: 1,
        name: 'Alex Thompson',
        first_name: 'Alex',
        last_name: 'Thompson',
        email: 'alex.student@tutorconnect.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        status: 'active',
        avgRating: 4.8,
        totalSessions: 15,
        progress: 85,
        hoursLearned: 32,
        subjects: ['Mathematics', 'Physics'],
        lastSession: '2025-09-28',
        joinedDate: '2025-08-15',
        gradeLevel: '12th Grade',
        school: 'Central High School',
        parentContact: 'parent@example.com',
        notes: 'Excellent student, very dedicated to learning. Shows strong progress in calculus.',
        upcomingSessions: 3,
        completedAssignments: 12,
        pendingAssignments: 2
    },
    {
        id: 2,
        name: 'Taylor Brown',
        first_name: 'Taylor',
        last_name: 'Brown',
        email: 'taylor.study@tutorconnect.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        status: 'active',
        avgRating: 4.5,
        totalSessions: 8,
        progress: 65,
        hoursLearned: 18,
        subjects: ['Algebra', 'Chemistry'],
        lastSession: '2025-09-25',
        joinedDate: '2025-09-01',
        gradeLevel: '10th Grade',
        school: 'Westfield Academy',
        parentContact: 'taylor.parent@email.com',
        notes: 'Struggling with algebra but making steady progress. Needs encouragement.',
        upcomingSessions: 2,
        completedAssignments: 6,
        pendingAssignments: 3
    },
    {
        id: 3,
        name: 'Jamie Wilson',
        first_name: 'Jamie',
        last_name: 'Wilson',
        email: 'jamie.learner@tutorconnect.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        status: 'active',
        avgRating: 4.9,
        totalSessions: 22,
        progress: 92,
        hoursLearned: 45,
        subjects: ['Computer Science', 'Mathematics'],
        lastSession: '2025-09-29',
        joinedDate: '2025-07-10',
        gradeLevel: 'College Sophomore',
        school: 'State University',
        parentContact: null,
        notes: 'Advanced student with excellent programming skills. Ready for advanced topics.',
        upcomingSessions: 4,
        completedAssignments: 18,
        pendingAssignments: 1
    }
];

const TutorStudents = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, [user?.id]);

    const fetchStudents = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Try to fetch from API first, fall back to mock data
            try {
                const studentsData = await tutorService.getTutorStudents(user.id);
                const sessionsData = await sessionService.getSessions();
                console.log("Loaded sessions for students:", sessionsData?.length || 0);
                setStudents(studentsData || mockStudents);
            } catch (apiError) {
                console.warn('API not available, using mock data:', apiError);
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                setStudents(mockStudents);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students. Please try again.');
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

    const filteredStudents = students.filter(student => {
        const studentName = student.first_name && student.last_name ?
            `${student.first_name} ${student.last_name}` :
            student.name || '';
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

    const StudentCard = ({ student }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedStudent(student)}>
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
                        {student.avgRating || 'N/A'}
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
                    <p className="text-2xl font-bold text-green-600">{student.progress || 0}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{student.hoursLearned || 0}h</p>
                    <p className="text-xs text-gray-500">Hours Learned</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                    {(student.subjects || []).map((subject, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {subject}
                        </span>
                    ))}
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
                            // Handle message action
                            console.log('Message student:', student.name);
                        }}
                    >
                        <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle calendar action
                            console.log('Schedule session with:', student.name);
                        }}
                    >
                        <Calendar className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const StudentDetailModal = ({ student, onClose }) => {
        const [isEditingNotes, setIsEditingNotes] = useState(false);
        const [notes, setNotes] = useState(student.notes || '');

        const handleSaveNotes = () => {
            // TODO: Save notes to backend
            console.log('Saving notes for student:', student.name, notes);
            setIsEditingNotes(false);
        };

        const handleScheduleSession = () => {
            // TODO: Implement session scheduling
            console.log('Schedule session with:', student.name);
            alert(`Scheduling session with ${student.name}. This feature will be implemented soon.`);
        };

        const handleSendMessage = () => {
            // TODO: Implement messaging
            console.log('Send message to:', student.name);
            alert(`Sending message to ${student.name}. This feature will be implemented soon.`);
        };

        const handleViewAllSessions = () => {
            // TODO: Navigate to sessions view
            console.log('View all sessions for:', student.name);
            alert(`Viewing all sessions for ${student.name}. This feature will be implemented soon.`);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}>
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                                    <p className="text-sm text-gray-500">
                                        Joined {student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Progress Overview */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h3>
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
                                                    <p className="text-2xl font-bold text-green-600">{student.progress || 0}%</p>
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
                                                    <p className="text-2xl font-bold text-yellow-600">{student.avgRating || 'N/A'}</p>
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
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Grade Level:</span>
                                            <p className="text-gray-900">{student.gradeLevel || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">School:</span>
                                            <p className="text-gray-900">{student.school || 'Not specified'}</p>
                                        </div>
                                        {student.parentContact && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Parent Contact:</span>
                                                <p className="text-gray-900">{student.parentContact}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Subjects:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(student.subjects || []).map((subject, index) => (
                                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                        {subject}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments and Notes */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Status</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{student.completedAssignments || 0}</p>
                                            <p className="text-sm text-gray-600">Completed</p>
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-lg">
                                            <p className="text-2xl font-bold text-orange-600">{student.pendingAssignments || 0}</p>
                                            <p className="text-sm text-orange-600">Pending</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                                        <button
                                            onClick={() => setIsEditingNotes(!isEditingNotes)}
                                            className="text-sm text-primary-600 hover:text-primary-700"
                                        >
                                            {isEditingNotes ? 'Cancel' : 'Edit'}
                                        </button>
                                    </div>
                                    {isEditingNotes ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                                rows={4}
                                                placeholder="Add notes about this student..."
                                            />
                                            <button
                                                onClick={handleSaveNotes}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                                            >
                                                Save Notes
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700">{notes || 'No notes available'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleScheduleSession}
                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Session
                            </button>
                            <button
                                onClick={handleSendMessage}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Message
                            </button>
                            <button
                                onClick={handleViewAllSessions}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                View All Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
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

            {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <BookOpen className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
            )}

            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default TutorStudents;