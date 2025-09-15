import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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

    // Mock messages data
    const messages = {
        announcements: [
            {
                id: 'ANN001',
                title: 'Platform Maintenance Scheduled',
                content: 'We will be performing scheduled maintenance on Sunday, January 21st from 2:00 AM to 4:00 AM EST. During this time, the platform may be temporarily unavailable.',
                type: 'announcement',
                priority: 'high',
                status: 'published',
                targetAudience: 'all',
                author: 'System Admin',
                createdAt: '2024-01-15T10:30:00Z',
                publishedAt: '2024-01-15T10:35:00Z',
                views: 1247,
                recipients: 1247,
                tags: ['maintenance', 'system'],
                attachments: []
            },
            {
                id: 'ANN002',
                title: 'New Feature: Video Recording',
                content: 'We\'re excited to announce a new feature that allows tutors to record sessions for student review. This feature is now available in your session dashboard.',
                type: 'announcement',
                priority: 'medium',
                status: 'published',
                targetAudience: 'tutors',
                author: 'Product Team',
                createdAt: '2024-01-14T14:20:00Z',
                publishedAt: '2024-01-14T15:00:00Z',
                views: 156,
                recipients: 156,
                tags: ['feature', 'tutors', 'video'],
                attachments: ['feature_guide.pdf']
            },
            {
                id: 'ANN003',
                title: 'Winter Break Schedule Update',
                content: 'Please note updated availability requirements during the winter break period. All tutors should update their calendars by January 20th.',
                type: 'announcement',
                priority: 'medium',
                status: 'draft',
                targetAudience: 'tutors',
                author: 'Admin Team',
                createdAt: '2024-01-15T09:15:00Z',
                publishedAt: null,
                views: 0,
                recipients: 0,
                tags: ['schedule', 'winter', 'availability'],
                attachments: []
            }
        ],
        support: [
            {
                id: 'SUP001',
                title: 'Payment Issue - Student ID: STU123',
                content: 'Student reported payment failure during session booking. Credit card was charged but session was not confirmed.',
                type: 'support',
                priority: 'high',
                status: 'open',
                targetAudience: 'internal',
                author: 'Emma Wilson',
                assignee: 'Support Team',
                createdAt: '2024-01-15T11:45:00Z',
                updatedAt: '2024-01-15T12:30:00Z',
                responses: 3,
                tags: ['payment', 'urgent', 'student'],
                attachments: ['payment_screenshot.png']
            },
            {
                id: 'SUP002',
                title: 'Tutor Verification Request',
                content: 'New tutor application requires document verification. All credentials have been submitted and are ready for review.',
                type: 'support',
                priority: 'medium',
                status: 'in-progress',
                targetAudience: 'internal',
                author: 'System',
                assignee: 'Verification Team',
                createdAt: '2024-01-15T08:20:00Z',
                updatedAt: '2024-01-15T10:15:00Z',
                responses: 1,
                tags: ['verification', 'tutor', 'documents'],
                attachments: ['diploma.pdf', 'certification.pdf']
            },
            {
                id: 'SUP003',
                title: 'Session Quality Complaint',
                content: 'Student reported poor audio quality during yesterday\'s physics session. Requesting refund and session rescheduling.',
                type: 'support',
                priority: 'medium',
                status: 'resolved',
                targetAudience: 'internal',
                author: 'Alex Chen',
                assignee: 'Quality Team',
                createdAt: '2024-01-14T16:30:00Z',
                updatedAt: '2024-01-15T09:45:00Z',
                responses: 5,
                tags: ['quality', 'refund', 'technical'],
                attachments: []
            }
        ],
        internal: [
            {
                id: 'INT001',
                title: 'Weekly Team Standup Notes',
                content: 'Summary of this week\'s development progress, upcoming releases, and team announcements.',
                type: 'internal',
                priority: 'low',
                status: 'published',
                targetAudience: 'staff',
                author: 'Development Team',
                createdAt: '2024-01-15T17:00:00Z',
                publishedAt: '2024-01-15T17:05:00Z',
                views: 23,
                recipients: 25,
                tags: ['standup', 'development', 'weekly'],
                attachments: ['standup_notes.md']
            },
            {
                id: 'INT002',
                title: 'Security Protocol Update',
                content: 'New security measures have been implemented. All staff members must review and acknowledge the updated protocols.',
                type: 'internal',
                priority: 'high',
                status: 'published',
                targetAudience: 'staff',
                author: 'Security Team',
                createdAt: '2024-01-14T10:00:00Z',
                publishedAt: '2024-01-14T10:30:00Z',
                views: 25,
                recipients: 25,
                tags: ['security', 'protocols', 'mandatory'],
                attachments: ['security_guidelines.pdf']
            }
        ]
    };

    // Statistics
    const stats = {
        totalMessages: Object.values(messages).flat().length,
        announcements: messages.announcements.length,
        supportTickets: messages.support.length,
        internalMessages: messages.internal.length,
        pendingReview: Object.values(messages).flat().filter(m => m.status === 'draft').length,
        highPriority: Object.values(messages).flat().filter(m => m.priority === 'high').length
    };

    // Get messages for current tab
    const currentMessages = messages[selectedTab] || [];

    // Filter messages
    const filteredMessages = currentMessages.filter(message => {
        const matchesSearch = searchTerm === '' ||
            message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
    });

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
    };

    const openComposeModal = (type) => {
        setMessageType(type);
        setShowComposeModal(true);
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

                {/* Messages Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMessages.map((message) => (
                        <MessageCard key={message.id} message={message} />
                    ))}
                </div>

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

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter message title..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {messageType === 'announcement' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="all">All Users</option>
                                            <option value="students">Students Only</option>
                                            <option value="tutors">Tutors Only</option>
                                            <option value="staff">Staff Only</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                                    <textarea
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your message content..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter tags separated by commas..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Drag and drop files here, or click to browse</p>
                                        <input type="file" multiple className="hidden" />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Send className="w-4 h-4 inline mr-2" />
                                        Publish Now
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