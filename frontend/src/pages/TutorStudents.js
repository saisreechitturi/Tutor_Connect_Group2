import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorService, sessionService } from '../services';
import { Search, Filter, MessageCircle, Calendar, BookOpen, Star, Clock, TrendingUp, Award } from 'lucide-react';

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
            const studentsData = await tutorService.getTutorStudents(user.id);
            setStudents(studentsData || []);
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
                        src={student.avatar}
                        alt={student.name}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(student.status)}`}>
                            {student.status}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {student.avgRating}
                    </div>
                    <p className="text-xs text-gray-400">Avg Rating</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{student.totalSessions}</p>
                    <p className="text-xs text-gray-500">Total Sessions</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{student.progress}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{student.hoursLearned}h</p>
                    <p className="text-xs text-gray-500">Hours Learned</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                    {student.subjects.map((subject, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {subject}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Last session: {new Date(student.lastSession).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-primary-600 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-primary-600 transition-colors">
                        <Calendar className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const StudentDetailModal = ({ student, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="h-16 w-16 rounded-full object-cover"
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                                <p className="text-gray-600">{student.email}</p>
                                <p className="text-sm text-gray-500">Joined {new Date(student.joinedDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-secondary"
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
                                                <p className="text-2xl font-bold text-blue-600">{student.totalSessions}</p>
                                                <p className="text-sm text-blue-600">Total Sessions</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <TrendingUp className="h-8 w-8 text-green-600" />
                                            <div className="ml-3">
                                                <p className="text-2xl font-bold text-green-600">{student.progress}%</p>
                                                <p className="text-sm text-green-600">Progress</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <Clock className="h-8 w-8 text-purple-600" />
                                            <div className="ml-3">
                                                <p className="text-2xl font-bold text-purple-600">{student.hoursLearned}h</p>
                                                <p className="text-sm text-purple-600">Hours Learned</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <div className="flex items-center">
                                            <Star className="h-8 w-8 text-yellow-600" />
                                            <div className="ml-3">
                                                <p className="text-2xl font-bold text-yellow-600">{student.avgRating}</p>
                                                <p className="text-sm text-yellow-600">Avg Rating</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Achievements</h3>
                                <div className="flex flex-wrap gap-2">
                                    {student.achievements.map((achievement, index) => (
                                        <div key={index} className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                            <Award className="h-4 w-4" />
                                            <span>{achievement}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Phone:</span> {student.phoneNumber}</p>
                                    <p><span className="font-medium">Timezone:</span> {student.timezone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Learning Details */}
                        <div className="space-y-6">
                            {/* Learning Goals */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Learning Goals</h3>
                                <ul className="space-y-2">
                                    {student.learningGoals.map((goal, index) => (
                                        <li key={index} className="flex items-center text-sm">
                                            <div className="h-2 w-2 bg-primary-600 rounded-full mr-3"></div>
                                            {goal}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <h4 className="font-medium text-green-900 mb-2">Strong Areas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {student.strongAreas.map((area, index) => (
                                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-red-900 mb-2">Areas for Improvement</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {student.weakAreas.map((area, index) => (
                                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Tutor Notes</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700">{student.notes}</p>
                                </div>
                                <div className="mt-3 flex space-x-2">
                                    <button className="btn-primary text-sm">Edit Notes</button>
                                    <button className="btn-outline text-sm">Add Progress Update</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex space-x-4 pt-6 border-t border-gray-200">
                        <button className="btn-primary flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Schedule Session</span>
                        </button>
                        <button className="btn-outline flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Send Message</span>
                        </button>
                        <button className="btn-outline">View All Sessions</button>
                    </div>
                </div>
            </div>
        </div>
    );

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
                            className="pl-10 input-field"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-field min-w-[120px]"
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