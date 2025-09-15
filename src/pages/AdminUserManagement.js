import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, User, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminUserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Mock users data (extended from existing data)
    const users = [
        {
            id: 1,
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'student@example.com',
            phone: '+1234567890',
            role: 'student',
            status: 'active',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
            joinedDate: '2024-01-15',
            lastLogin: '2024-09-14',
            location: 'New York, NY',
            totalSessions: 24,
            totalSpent: 1080
        },
        {
            id: 2,
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'tutor@example.com',
            phone: '+1234567891',
            role: 'tutor',
            status: 'active',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            joinedDate: '2023-08-20',
            lastLogin: '2024-09-14',
            location: 'San Francisco, CA',
            totalSessions: 156,
            totalEarned: 7020,
            rating: 4.8,
            subjects: ['JavaScript', 'React', 'Node.js'],
            verified: true
        },
        {
            id: 3,
            firstName: 'Carol',
            lastName: 'Williams',
            email: 'admin@example.com',
            phone: '+1234567892',
            role: 'admin',
            status: 'active',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            joinedDate: '2023-05-10',
            lastLogin: '2024-09-14',
            location: 'Austin, TX'
        },
        {
            id: 4,
            firstName: 'Emma',
            lastName: 'Davis',
            email: 'tutor2@example.com',
            phone: '+1234567893',
            role: 'tutor',
            status: 'active',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            joinedDate: '2023-09-15',
            lastLogin: '2024-09-13',
            location: 'Chicago, IL',
            totalSessions: 203,
            totalEarned: 12180,
            rating: 4.9,
            subjects: ['Calculus', 'Linear Algebra', 'Statistics'],
            verified: true
        },
        {
            id: 5,
            firstName: 'David',
            lastName: 'Wilson',
            email: 'tutor3@example.com',
            phone: '+1234567894',
            role: 'tutor',
            status: 'pending',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            joinedDate: '2023-08-20',
            lastLogin: '2024-09-12',
            location: 'Boston, MA',
            totalSessions: 178,
            totalEarned: 9790,
            rating: 4.7,
            subjects: ['Physics', 'Quantum Mechanics'],
            verified: false
        },
        {
            id: 6,
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'tutor4@example.com',
            phone: '+1234567895',
            role: 'tutor',
            status: 'suspended',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            joinedDate: '2023-07-10',
            lastLogin: '2024-09-05',
            location: 'Miami, FL',
            totalSessions: 245,
            totalEarned: 8575,
            rating: 4.8,
            subjects: ['Spanish', 'Literature'],
            verified: true
        }
    ];

    const [userList, setUserList] = useState(users);

    const filteredUsers = userList.filter(user => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.subjects && user.subjects.some(subject =>
                subject.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'tutor': return 'bg-blue-100 text-blue-800';
            case 'student': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const updateUserStatus = (userId, newStatus) => {
        setUserList(prev => prev.map(user =>
            user.id === userId ? { ...user, status: newStatus } : user
        ));
    };

    const deleteUser = (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setUserList(prev => prev.filter(user => user.id !== userId));
        }
    };

    const UserCard = ({ user }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {user.status}
                            </span>
                            {user.role === 'tutor' && user.verified && (
                                <CheckCircle className="h-4 w-4 text-green-600" title="Verified Tutor" />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setSelectedUser(user)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Joined</p>
                    <p className="font-medium">{new Date(user.joinedDate).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-500">Last Login</p>
                    <p className="font-medium">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
                {user.role === 'student' && (
                    <>
                        <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">{user.totalSessions}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total Spent</p>
                            <p className="font-medium">${user.totalSpent}</p>
                        </div>
                    </>
                )}
                {user.role === 'tutor' && (
                    <>
                        <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">{user.totalSessions}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total Earned</p>
                            <p className="font-medium">${user.totalEarned}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Rating</p>
                            <p className="font-medium">{user.rating} ⭐</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Subjects</p>
                            <p className="font-medium">{user.subjects?.length || 0}</p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-4 flex space-x-2">
                {user.status === 'pending' && (
                    <>
                        <button
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="btn-primary text-xs"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            className="btn-danger text-xs"
                        >
                            Reject
                        </button>
                    </>
                )}
                {user.status === 'active' && (
                    <button
                        onClick={() => updateUserStatus(user.id, 'suspended')}
                        className="btn-danger text-xs"
                    >
                        Suspend
                    </button>
                )}
                {user.status === 'suspended' && (
                    <button
                        onClick={() => updateUserStatus(user.id, 'active')}
                        className="btn-primary text-xs"
                    >
                        Reactivate
                    </button>
                )}
            </div>
        </div>
    );

    const UserDetailModal = ({ user, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                        <button onClick={onClose} className="btn-secondary">Close</button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                    {user.role}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{user.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{user.location}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>Joined: {new Date(user.joinedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>Last Login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {user.role === 'tutor' && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Tutor Statistics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-600">Sessions</p>
                                    <p className="text-xl font-bold text-blue-600">{user.totalSessions}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-sm text-green-600">Earned</p>
                                    <p className="text-xl font-bold text-green-600">${user.totalEarned}</p>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-600">Rating</p>
                                    <p className="text-xl font-bold text-yellow-600">{user.rating}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-sm text-purple-600">Subjects</p>
                                    <p className="text-xl font-bold text-purple-600">{user.subjects?.length || 0}</p>
                                </div>
                            </div>
                            {user.subjects && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Teaching Subjects:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.subjects.map((subject, index) => (
                                            <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button className="btn-primary">Edit User</button>
                        <button className="btn-secondary">Send Message</button>
                        <button className="btn-outline">View Activity</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const stats = {
        total: userList.length,
        students: userList.filter(u => u.role === 'student').length,
        tutors: userList.filter(u => u.role === 'tutor').length,
        admins: userList.filter(u => u.role === 'admin').length,
        active: userList.filter(u => u.status === 'active').length,
        pending: userList.filter(u => u.status === 'pending').length,
        suspended: userList.filter(u => u.status === 'suspended').length
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Manage all platform users, roles, and permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-green-600">Students</p>
                    <p className="text-2xl font-bold text-green-600">{stats.students}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-blue-600">Tutors</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.tutors}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-purple-600">Admins</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-green-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-red-600">Suspended</p>
                    <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 input-field"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="input-field min-w-[120px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="tutor">Tutors</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-field min-w-[120px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};

export default AdminUserManagement;