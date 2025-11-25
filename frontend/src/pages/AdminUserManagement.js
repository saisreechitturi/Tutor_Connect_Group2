import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { adminService } from '../services';

const AdminUserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        console.log('Setting user list:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
        setUserList(users);
    }, [users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminService.getAllUsers();
            const usersData = response.users || response;

            // Transform API data to match expected format
            const transformedUsers = usersData.map(user => ({
                id: user.id,
                first_name: user.firstName || user.first_name,
                last_name: user.lastName || user.last_name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                phone: user.phone || 'N/A',
                joinedDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A',
                lastLogin: user.lastLogin || user.createdAt || 'Never',
                emailVerified: user.emailVerified !== false,
                totalSessions: user.tutorStats?.totalSessions || 0,
                totalEarned: user.tutorStats?.totalEarnings || 0,
                rating: user.tutorStats?.rating || 0,
                subjects: user.subjects || [],
                isVerified: user.tutorStats?.isVerified || false, // For tutors
                avatar: `https://images.unsplash.com/photo-${user.role === 'tutor' ? '1494790108755-2616b612b786' : user.role === 'admin' ? '1560250097-f9871d5e6e74' : '1472099645785-5658abf4ff4e'}?w=150`
            }));

            setUsers(transformedUsers);
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

    const filteredUsers = userList.filter(user => {
        const matchesSearch =
            (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.subjects && user.subjects.some(subject =>
                subject.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Active' : 'Inactive';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'tutor': return 'bg-blue-100 text-blue-800';
            case 'student': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUserInitial = (firstName, lastName) => {
        if (firstName) {
            return firstName.charAt(0).toUpperCase();
        }
        if (lastName) {
            return lastName.charAt(0).toUpperCase();
        }
        return 'U'; // Default for 'User'
    };

    const getAvatarColor = (name) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const charCode = name ? name.charCodeAt(0) : 0;
        return colors[charCode % colors.length];
    };

    const updateUserStatus = async (userId, isActive) => {
        try {
            console.log(`Attempting to update user status:`, { userId, isActive });

            // Call the backend API to update user status
            const response = await adminService.toggleUserStatus(userId, isActive ? 'active' : 'inactive');
            console.log('Status update response:', response);

            // Update local state with API response
            if (response && response.user) {
                setUserList(prev => prev.map(user =>
                    user.id === userId ? {
                        ...user,
                        isActive: response.user.isActive
                    } : user
                ));
            }

            console.log(`Successfully updated user ${userId} status to ${isActive ? 'active' : 'inactive'}`);
        } catch (err) {
            console.error('Error updating user status:', err);
            alert(`Failed to update user status. Error: ${err.response?.data?.message || err.message}`);
        }
    };

    const updateTutorVerification = async (userId, isVerified) => {
        try {
            console.log(`Attempting to update tutor verification:`, { userId, isVerified });

            // Call the backend API to update tutor verification
            const response = await adminService.updateTutorVerification(userId, isVerified);
            console.log('Tutor verification response:', response);

            // Update local state
            setUserList(prev => prev.map(user =>
                user.id === userId ? {
                    ...user,
                    isVerified: isVerified
                } : user
            ));

            console.log(`Successfully updated tutor ${userId} verification to ${isVerified}`);
        } catch (err) {
            console.error('Error updating tutor verification:', err);
            alert(`Failed to update tutor verification. Error: ${err.response?.data?.message || err.message}`);
        }
    };

    const UserCard = ({ user }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-lg ${getAvatarColor(user.first_name || user.last_name || user.email)}`}>
                        {getUserInitial(user.first_name, user.last_name)}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{user.first_name || 'Unknown'} {user.last_name || 'User'}</h3>
                        <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role || 'No role'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                                {getStatusText(user.isActive)}
                            </span>
                            {user.role === 'tutor' && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {user.isVerified ? 'Verified' : 'Unverified'}
                                </span>
                            )}
                            {user.role === 'tutor' && user.verified && (
                                <CheckCircle className="h-4 w-4 text-green-600" title="Verified Tutor" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Joined</p>
                    <p className="font-medium">{user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                    <p className="text-gray-500">Last Login</p>
                    <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
                </div>
                {user.role === 'student' && (
                    <>
                        <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">{user.totalSessions || 0}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total Spent</p>
                            <p className="font-medium">${user.totalSpent || 0}</p>
                        </div>
                    </>
                )}
                {user.role === 'tutor' && (
                    <>
                        <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">{user.totalSessions || 0}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total Earned</p>
                            <p className="font-medium">${user.totalEarned || 0}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Rating</p>
                            <p className="font-medium">{user.rating || 0} ⭐</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Subjects</p>
                            <p className="font-medium">{user.subjects?.length || 0}</p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-4 flex space-x-2">
                {user.role === 'tutor' && !user.isVerified && (
                    <button
                        onClick={() => updateTutorVerification(user.id, true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                        Approve Tutor
                    </button>
                )}
                {user.isActive ? (
                    <button
                        onClick={() => updateUserStatus(user.id, false)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                        Deactivate
                    </button>
                ) : (
                    <button
                        onClick={() => updateUserStatus(user.id, true)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    >
                        Activate
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
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-medium text-xl ${getAvatarColor(user.first_name || user.last_name || user.email)}`}>
                            {getUserInitial(user.first_name, user.last_name)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{user.first_name || 'Unknown'} {user.last_name || 'User'}</h3>
                            <p className="text-gray-600">{user.email || 'No email'}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                    {user.role}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                                    {getStatusText(user.isActive)}
                                </span>
                                {user.role === 'tutor' && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {user.isVerified ? 'Verified' : 'Unverified'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{user.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{user.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{user.location || 'No location'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>Joined: {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'Unknown'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
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
                                    <p className="text-xl font-bold text-blue-600">{user.totalSessions || 0}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-sm text-green-600">Earned</p>
                                    <p className="text-xl font-bold text-green-600">${user.totalEarned || 0}</p>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-600">Rating</p>
                                    <p className="text-xl font-bold text-yellow-600">{user.rating || 0}</p>
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
                        <button
                            onClick={() => {
                                console.log('Send message to:', user.first_name, user.last_name);
                                alert('Send message functionality will be implemented soon.');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Send Message
                        </button>
                        <button
                            onClick={() => {
                                console.log('View activity for:', user.first_name, user.last_name);
                                alert('View activity functionality will be implemented soon.');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            View Activity
                        </button>
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
        active: userList.filter(u => u.isActive).length,
        inactive: userList.filter(u => !u.isActive).length,
        verified_tutors: userList.filter(u => u.role === 'tutor' && u.isVerified).length
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage all platform users, roles, and permissions</p>
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
                    <p className="text-sm text-red-600">Inactive</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-blue-600">Verified Tutors</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.verified_tutors}</p>
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
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            title="Reset all filters"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            <span>Reset</span>
                        </button>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-[120px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="tutor">Tutors</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-[120px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
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

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                                    <p className="text-gray-600">User creation form will be implemented here.</p>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;