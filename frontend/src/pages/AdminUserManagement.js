import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, User, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { adminService } from '../services';

const AdminUserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const usersData = await adminService.getAllUsers();
            setUsers(usersData || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
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
                                    <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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
                        <h3 className="text-red-800 font-medium">Error loading users</h3>
                        <p className="text-red-600 mt-1">{error}</p>
                        <button
                            onClick={fetchUsers}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const [userList, setUserList] = useState([]);

    useEffect(() => {
        setUserList(users);
    }, [users]);

    const filteredUsers = userList.filter(user => {
        const matchesSearch =
            (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    const updateUserStatus = async (userId, newStatus) => {
        try {
            await adminService.updateUserStatus(userId, newStatus);
            setUserList(prev => prev.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));
        } catch (err) {
            console.error('Error updating user status:', err);
            alert('Failed to update user status. Please try again.');
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await adminService.deleteUser(userId);
                setUserList(prev => prev.filter(user => user.id !== userId));
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Failed to delete user. Please try again.');
            }
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