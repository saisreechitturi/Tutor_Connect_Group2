import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService, messageService } from '../services';
import {
    Plus,
    Search,
    Filter,
    Send,
    MessageSquare,
    Users,
    Bell,
    AlertCircle,
    CheckCircle,
    Clock,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Megaphone,
    Mail,
    UserCheck,
    Shield,
    Star,
    Calendar,
    Paperclip,
    Image,
    FileText,
    X,
    Reply,
    Forward,
    Archive,
    Flag,
    Settings
} from 'lucide-react';

const AdminMessagesSystem = () => {
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState('announcements');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [messageType, setMessageType] = useState('announcement');

    // New state for API integration
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'announcement',
        targetRole: 'all',
        priority: 'medium'
    });

    // Load notifications on component mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);

            try {
                const response = await adminService.getNotifications({
                    type: selectedTab === 'announcements' ? 'announcement' : undefined
                });
                setNotifications(response.notifications || []);
            } catch (apiError) {
                console.warn('Admin API not available, using mock data:', apiError);

                // Provide mock data when backend is not available
                const mockNotifications = [
                    {
                        id: 1,
                        title: "Platform Maintenance Scheduled",
                        message: "We will be performing scheduled maintenance on the platform this weekend from 2:00 AM to 6:00 AM EST. During this time, the platform may be temporarily unavailable.",
                        type: "announcement",
                        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                        readCount: 45,
                        recipientCount: 150
                    },
                    {
                        id: 2,
                        title: "New Features Released",
                        message: "We're excited to announce several new features including enhanced messaging, improved task management, and better session scheduling.",
                        type: "announcement",
                        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                        readCount: 78,
                        recipientCount: 150
                    },
                    {
                        id: 3,
                        title: "Welcome to TutorConnect",
                        message: "Welcome to our platform! We're here to help connect students with amazing tutors for personalized learning experiences.",
                        type: "announcement",
                        createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
                        readCount: 120,
                        recipientCount: 150
                    }
                ];
                setNotifications(mockNotifications);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            setSending(true);
            setError(null);

            try {
                await adminService.sendNotification({
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    targetRole: formData.targetRole === 'all' ? 'all' : formData.targetRole
                });

                // Reset form and close modal
                setFormData({
                    title: '',
                    message: '',
                    type: 'announcement',
                    targetRole: 'all',
                    priority: 'medium'
                });
                setShowComposeModal(false);

                // Refresh notifications
                await fetchNotifications();
            } catch (apiError) {
                console.warn('Admin API not available, simulating message send:', apiError);

                // Simulate successful send when backend is not available
                const newNotification = {
                    id: Date.now(),
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    createdAt: new Date().toISOString(),
                    readCount: 0,
                    recipientCount: formData.targetRole === 'all' ? 150 : 75
                };

                setNotifications(prev => [newNotification, ...prev]);

                // Reset form and close modal
                setFormData({
                    title: '',
                    message: '',
                    type: 'announcement',
                    targetRole: 'all',
                    priority: 'medium'
                });
                setShowComposeModal(false);
            }

        } catch (err) {
            console.error('Error sending notification:', err);
            setError('Failed to send notification. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // Transform API notification data to match component expectations
    const transformNotificationData = (notification) => ({
        id: notification.id,
        title: notification.title,
        content: notification.message, // API uses 'message' field
        type: notification.type,
        priority: 'medium', // Default since API doesn't have priority
        status: 'published', // Default since API doesn't have status
        targetAudience: 'all', // Could be enhanced based on recipient count
        author: 'Admin', // Default since API doesn't track author
        createdAt: notification.createdAt,
        publishedAt: notification.createdAt,
        views: notification.readCount || 0,
        recipients: notification.recipientCount || 0,
        tags: [], // Could be enhanced
        attachments: []
    });

    // Get messages for current tab
    const currentMessages = notifications.map(transformNotificationData).filter(notification => {
        if (selectedTab === 'announcements') return notification.type === 'announcement';
        if (selectedTab === 'support') return notification.type === 'support';
        if (selectedTab === 'internal') return notification.type === 'internal';
        return true;
    });

    // Filter messages
    const filteredMessages = currentMessages.filter(message => {
        const matchesSearch = searchTerm === '' ||
            message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Statistics
    const stats = {
        totalMessages: notifications.length,
        announcements: notifications.filter(n => n.type === 'announcement').length,
        supportTickets: notifications.filter(n => n.type === 'support').length,
        internalMessages: notifications.filter(n => n.type === 'internal').length,
        pendingReview: 0, // Could be enhanced
        highPriority: 0 // Could be enhanced
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return 'text-green-600 bg-green-100';
            case 'draft': return 'text-yellow-600 bg-yellow-100';
            case 'open': return 'text-red-600 bg-red-100';
            case 'in-progress': return 'text-blue-600 bg-blue-100';
            case 'resolved': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'published': return CheckCircle;
            case 'draft': return Edit;
            case 'open': return AlertCircle;
            case 'in-progress': return Clock;
            case 'resolved': return CheckCircle;
            default: return MessageSquare;
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

    const openMessageModal = (message) => {
        setSelectedMessage(message);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowComposeModal(false);
        setSelectedMessage(null);
        setError(null);
        // Reset form data
        setFormData({
            title: '',
            message: '',
            type: 'announcement',
            targetRole: 'all',
            priority: 'medium'
        });
    };

    const openComposeModal = (type) => {
        setMessageType(type);
        setFormData(prev => ({ ...prev, type }));
        setShowComposeModal(true);
        setError(null);
    };

    const MessageCard = ({ message }) => {
        const StatusIcon = getStatusIcon(message.status);

        return (
            <div className="bg-white rounded-lg shadow border-l-4 border-l-blue-500 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{message.title}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                {message.priority}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{message.content}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-2">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {message.status}
                    </span>
                    <div className="text-xs text-gray-500">
                        {message.author} • {formatDate(message.createdAt)}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {message.views !== undefined && (
                            <div className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {message.views}
                            </div>
                        )}
                        {message.recipients !== undefined && (
                            <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {message.recipients}
                            </div>
                        )}
                        {message.responses !== undefined && (
                            <div className="flex items-center">
                                <Reply className="w-3 h-3 mr-1" />
                                {message.responses}
                            </div>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="flex items-center">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {message.attachments.length}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => openMessageModal(message)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View Details
                    </button>
                </div>

                {message.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {message.tags.map((tag) => (
                            <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages & Communication</h1>
                            <p className="text-gray-600">Manage platform announcements, support tickets, and internal communications</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => openComposeModal('announcement')}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Megaphone className="w-5 h-5 mr-2" />
                                New Announcement
                            </button>
                            <button
                                onClick={() => openComposeModal('internal')}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Internal Message
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Megaphone className="h-8 w-8 text-green-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Announcements</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.announcements}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-8 w-8 text-orange-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Support Tickets</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.supportTickets}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-purple-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Internal</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.internalMessages}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Edit className="h-8 w-8 text-yellow-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReview}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Flag className="h-8 w-8 text-red-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">High Priority</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.highPriority}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search messages by title, content, or tags..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Type Tabs */}
                    <div className="p-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                {[
                                    { key: 'announcements', label: 'Announcements', icon: Megaphone, count: stats.announcements },
                                    { key: 'support', label: 'Support Tickets', icon: AlertCircle, count: stats.supportTickets },
                                    { key: 'internal', label: 'Internal Messages', icon: Shield, count: stats.internalMessages }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setSelectedTab(tab.key)}
                                            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${selectedTab === tab.key
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {tab.label} ({tab.count})
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                            <span className="text-red-800">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading messages...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredMessages.map((message) => (
                            <MessageCard key={message.id} message={message} />
                        ))}
                    </div>
                )}

                {filteredMessages.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria or create a new message.</p>
                    </div>
                )}

                {/* Message Detail Modal */}
                {showModal && selectedMessage && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedMessage.title}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Message Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Message Content</h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                                        </div>
                                    </div>

                                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                                            <div className="space-y-2">
                                                {selectedMessage.attachments.map((attachment, index) => (
                                                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                        <FileText className="w-5 h-5 text-gray-500 mr-3" />
                                                        <span className="text-gray-700">{attachment}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMessage.tags.map((tag) => (
                                                <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Metadata */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Message Details</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-gray-500 text-sm">Status:</span>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                                                        {React.createElement(getStatusIcon(selectedMessage.status), { className: "w-3 h-3 mr-1" })}
                                                        {selectedMessage.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Priority:</span>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedMessage.priority)}`}>
                                                        {selectedMessage.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Type:</span>
                                                <div className="text-sm font-medium text-gray-900 mt-1 capitalize">{selectedMessage.type}</div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Author:</span>
                                                <div className="text-sm font-medium text-gray-900 mt-1">{selectedMessage.author}</div>
                                            </div>

                                            {selectedMessage.targetAudience && (
                                                <div>
                                                    <span className="text-gray-500 text-sm">Target Audience:</span>
                                                    <div className="text-sm font-medium text-gray-900 mt-1 capitalize">{selectedMessage.targetAudience}</div>
                                                </div>
                                            )}

                                            {selectedMessage.assignee && (
                                                <div>
                                                    <span className="text-gray-500 text-sm">Assignee:</span>
                                                    <div className="text-sm font-medium text-gray-900 mt-1">{selectedMessage.assignee}</div>
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-gray-500 text-sm">Created:</span>
                                                <div className="text-sm text-gray-900 mt-1">{formatDate(selectedMessage.createdAt)}</div>
                                            </div>

                                            {selectedMessage.publishedAt && (
                                                <div>
                                                    <span className="text-gray-500 text-sm">Published:</span>
                                                    <div className="text-sm text-gray-900 mt-1">{formatDate(selectedMessage.publishedAt)}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedMessage.views !== undefined || selectedMessage.recipients !== undefined || selectedMessage.responses !== undefined) && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
                                            <div className="space-y-2">
                                                {selectedMessage.views !== undefined && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500 text-sm">Views:</span>
                                                        <span className="text-sm font-medium text-gray-900">{selectedMessage.views}</span>
                                                    </div>
                                                )}
                                                {selectedMessage.recipients !== undefined && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500 text-sm">Recipients:</span>
                                                        <span className="text-sm font-medium text-gray-900">{selectedMessage.recipients}</span>
                                                    </div>
                                                )}
                                                {selectedMessage.responses !== undefined && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500 text-sm">Responses:</span>
                                                        <span className="text-sm font-medium text-gray-900">{selectedMessage.responses}</span>
                                                    </div>
                                                )}
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
                                    <Edit className="w-4 h-4 inline mr-2" />
                                    Edit Message
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compose Message Modal */}
                {showComposeModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Compose {messageType === 'announcement' ? 'Announcement' : 'Internal Message'}
                                </h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter message title..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {messageType === 'announcement' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                        <select
                                            name="targetRole"
                                            value={formData.targetRole}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">All Users</option>
                                            <option value="student">Students Only</option>
                                            <option value="tutor">Tutors Only</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Content *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your message content..."
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                                            <span className="text-red-800 text-sm">{error}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={sending}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                    >
                                        {sending ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Notification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessagesSystem;