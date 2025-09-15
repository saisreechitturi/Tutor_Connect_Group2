import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    Flag,
    MessageSquare,
    FileText,
    Settings,
    Zap,
    Bug,
    HelpCircle,
    Users,
    Shield,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    AlertTriangle,
    TrendingUp,
    Activity
} from 'lucide-react';

const AdminTasksManagement = () => {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Mock tasks data
    const tasks = [
        {
            id: 'TSK001',
            title: 'Fix Payment Gateway Integration',
            description: 'Users reporting payment failures during session booking. Integration with Stripe needs debugging.',
            category: 'technical',
            priority: 'high',
            status: 'in-progress',
            assignee: 'Tech Team',
            reporter: 'Sarah Johnson (Support)',
            createdAt: '2024-01-14T10:30:00Z',
            updatedAt: '2024-01-15T14:22:00Z',
            dueDate: '2024-01-16T17:00:00Z',
            tags: ['payment', 'bug', 'critical'],
            comments: 12,
            attachments: 3,
            estimatedHours: 8,
            completedHours: 5
        },
        {
            id: 'TSK002',
            title: 'Review Tutor Application - Michael Chen',
            description: 'New tutor application requires manual review and verification of credentials.',
            category: 'user-management',
            priority: 'medium',
            status: 'pending',
            assignee: 'Admin Team',
            reporter: 'System (Automated)',
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:15:00Z',
            dueDate: '2024-01-17T12:00:00Z',
            tags: ['verification', 'tutor', 'review'],
            comments: 2,
            attachments: 5,
            estimatedHours: 2,
            completedHours: 0
        },
        {
            id: 'TSK003',
            title: 'Platform Security Audit',
            description: 'Quarterly security audit to identify vulnerabilities and ensure compliance with data protection standards.',
            category: 'security',
            priority: 'high',
            status: 'scheduled',
            assignee: 'Security Team',
            reporter: 'Admin (Scheduled)',
            createdAt: '2024-01-10T08:00:00Z',
            updatedAt: '2024-01-12T16:45:00Z',
            dueDate: '2024-01-20T23:59:00Z',
            tags: ['security', 'audit', 'compliance'],
            comments: 8,
            attachments: 1,
            estimatedHours: 40,
            completedHours: 0
        },
        {
            id: 'TSK004',
            title: 'Student Complaint - Session Quality',
            description: 'Student reported poor session quality and requested refund. Investigation required.',
            category: 'support',
            priority: 'medium',
            status: 'completed',
            assignee: 'Support Team',
            reporter: 'Emma Wilson (Student)',
            createdAt: '2024-01-13T11:20:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            dueDate: '2024-01-15T17:00:00Z',
            tags: ['complaint', 'refund', 'quality'],
            comments: 15,
            attachments: 2,
            estimatedHours: 3,
            completedHours: 3
        },
        {
            id: 'TSK005',
            title: 'Update Privacy Policy',
            description: 'Privacy policy needs updates to comply with new data protection regulations.',
            category: 'legal',
            priority: 'medium',
            status: 'on-hold',
            assignee: 'Legal Team',
            reporter: 'Compliance Officer',
            createdAt: '2024-01-12T14:00:00Z',
            updatedAt: '2024-01-14T09:30:00Z',
            dueDate: '2024-01-25T17:00:00Z',
            tags: ['legal', 'privacy', 'compliance'],
            comments: 6,
            attachments: 4,
            estimatedHours: 12,
            completedHours: 2
        },
        {
            id: 'TSK006',
            title: 'Database Performance Optimization',
            description: 'Query response times have increased. Database optimization needed to improve performance.',
            category: 'technical',
            priority: 'high',
            status: 'in-progress',
            assignee: 'Database Team',
            reporter: 'System Monitoring',
            createdAt: '2024-01-14T16:45:00Z',
            updatedAt: '2024-01-15T13:15:00Z',
            dueDate: '2024-01-18T12:00:00Z',
            tags: ['performance', 'database', 'optimization'],
            comments: 9,
            attachments: 2,
            estimatedHours: 16,
            completedHours: 6
        },
        {
            id: 'TSK007',
            title: 'Monthly Revenue Report Generation',
            description: 'Generate and distribute monthly revenue report to stakeholders.',
            category: 'reporting',
            priority: 'low',
            status: 'scheduled',
            assignee: 'Finance Team',
            reporter: 'Admin (Recurring)',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T08:00:00Z',
            dueDate: '2024-01-31T17:00:00Z',
            tags: ['reporting', 'finance', 'monthly'],
            comments: 3,
            attachments: 0,
            estimatedHours: 4,
            completedHours: 0
        },
        {
            id: 'TSK008',
            title: 'Content Moderation Review',
            description: 'Weekly review of flagged content and user reports for community guidelines violations.',
            category: 'moderation',
            priority: 'medium',
            status: 'pending',
            assignee: 'Moderation Team',
            reporter: 'System (Automated)',
            createdAt: '2024-01-15T06:00:00Z',
            updatedAt: '2024-01-15T06:00:00Z',
            dueDate: '2024-01-16T18:00:00Z',
            tags: ['moderation', 'content', 'review'],
            comments: 1,
            attachments: 8,
            estimatedHours: 6,
            completedHours: 0
        }
    ];

    // Task categories and their configurations
    const categories = {
        all: { label: 'All Tasks', icon: FileText, color: 'gray' },
        technical: { label: 'Technical', icon: Settings, color: 'blue' },
        support: { label: 'Support', icon: HelpCircle, color: 'green' },
        'user-management': { label: 'User Management', icon: Users, color: 'purple' },
        security: { label: 'Security', icon: Shield, color: 'red' },
        legal: { label: 'Legal', icon: FileText, color: 'yellow' },
        reporting: { label: 'Reporting', icon: TrendingUp, color: 'indigo' },
        moderation: { label: 'Moderation', icon: Eye, color: 'pink' }
    };

    const priorities = {
        low: { label: 'Low', color: 'bg-gray-100 text-gray-800', icon: Flag },
        medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
        high: { label: 'High', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
        critical: { label: 'Critical', color: 'bg-red-200 text-red-900', icon: Zap }
    };

    const statuses = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Activity },
        'on-hold': { label: 'On Hold', color: 'bg-gray-100 text-gray-800', icon: XCircle },
        scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-800', icon: Calendar },
        completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    // Statistics
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
        const matchesSearch = searchTerm === '' ||
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesCategory && matchesStatus && matchesSearch;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isOverdue = (dueDate, status) => {
        return new Date(dueDate) < new Date() && status !== 'completed';
    };

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const closeModal = () => {
        setShowTaskModal(false);
        setShowCreateModal(false);
        setSelectedTask(null);
    };

    const TaskCard = ({ task }) => {
        const CategoryIcon = categories[task.category]?.icon || FileText;
        const StatusConfig = statuses[task.status];
        const PriorityConfig = priorities[task.priority];
        const StatusIcon = StatusConfig.icon;
        const PriorityIcon = PriorityConfig.icon;

        return (
            <div className={`bg-white rounded-lg shadow border-l-4 p-4 hover:shadow-md transition-shadow ${isOverdue(task.dueDate, task.status) ? 'border-l-red-500' : `border-l-${categories[task.category]?.color || 'gray'}-500`
                }`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <CategoryIcon className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PriorityConfig.color}`}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {PriorityConfig.label}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${StatusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {StatusConfig.label}
                    </span>
                    <div className="text-xs text-gray-500">
                        Due: {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate, task.status) && (
                            <span className="text-red-600 font-medium ml-1">(Overdue)</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                        <User className="w-4 h-4 inline mr-1" />
                        {task.assignee}
                    </div>
                    <div className="text-sm text-gray-500">
                        {task.completedHours}/{task.estimatedHours}h
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {task.comments}
                        </div>
                        <div className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {task.attachments}
                        </div>
                    </div>
                    <button
                        onClick={() => openTaskModal(task)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View Details
                    </button>
                </div>

                {task.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
                            <p className="text-gray-600">Manage platform maintenance, support tickets, and operational tasks</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Task
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Pending</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <Activity className="h-8 w-8 text-blue-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">In Progress</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Completed</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Overdue</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
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
                                        placeholder="Search tasks by title, description, or tags..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {Object.entries(categories).map(([key, category]) => (
                                        <option key={key} value={key}>{category.label}</option>
                                    ))}
                                </select>

                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    {Object.entries(statuses).map(([key, status]) => (
                                        <option key={key} value={key}>{status.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="p-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 overflow-x-auto">
                                {Object.entries(categories).map(([key, category]) => {
                                    const Icon = category.icon;
                                    const count = key === 'all' ? tasks.length : tasks.filter(t => t.category === key).length;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${selectedCategory === key
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {category.label} ({count})
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>

                {filteredTasks.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria or create a new task.</p>
                    </div>
                )}

                {/* Task Detail Modal */}
                {showTaskModal && selectedTask && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Task Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                        <p className="text-gray-700">{selectedTask.description}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTask.tags.map((tag) => (
                                                <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Progress</h4>
                                        <div className="bg-gray-200 rounded-full h-4">
                                            <div
                                                className="bg-blue-600 h-4 rounded-full"
                                                style={{ width: `${(selectedTask.completedHours / selectedTask.estimatedHours) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                                            <span>{selectedTask.completedHours}h completed</span>
                                            <span>{selectedTask.estimatedHours}h estimated</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Metadata */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Task Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-gray-500 text-sm">Status:</span>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statuses[selectedTask.status].color}`}>
                                                        {React.createElement(statuses[selectedTask.status].icon, { className: "w-3 h-3 mr-1" })}
                                                        {statuses[selectedTask.status].label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Priority:</span>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorities[selectedTask.priority].color}`}>
                                                        {React.createElement(priorities[selectedTask.priority].icon, { className: "w-3 h-3 mr-1" })}
                                                        {priorities[selectedTask.priority].label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Category:</span>
                                                <div className="text-sm font-medium text-gray-900 mt-1">
                                                    {categories[selectedTask.category]?.label}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Assignee:</span>
                                                <div className="text-sm font-medium text-gray-900 mt-1">{selectedTask.assignee}</div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Reporter:</span>
                                                <div className="text-sm font-medium text-gray-900 mt-1">{selectedTask.reporter}</div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Due Date:</span>
                                                <div className={`text-sm font-medium mt-1 ${isOverdue(selectedTask.dueDate, selectedTask.status) ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {formatDate(selectedTask.dueDate)}
                                                    {isOverdue(selectedTask.dueDate, selectedTask.status) && (
                                                        <span className="block text-red-600 text-xs">(Overdue)</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Created:</span>
                                                <div className="text-sm text-gray-900 mt-1">{formatDate(selectedTask.createdAt)}</div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Last Updated:</span>
                                                <div className="text-sm text-gray-900 mt-1">{formatDate(selectedTask.updatedAt)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Activity</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500 text-sm">Comments:</span>
                                                <span className="text-sm font-medium text-gray-900">{selectedTask.comments}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500 text-sm">Attachments:</span>
                                                <span className="text-sm font-medium text-gray-900">{selectedTask.attachments}</span>
                                            </div>
                                        </div>
                                    </div>
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
                                    Edit Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Task Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Create New Task</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter task title..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe the task..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            {Object.entries(categories).filter(([key]) => key !== 'all').map(([key, category]) => (
                                                <option key={key} value={key}>{category.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            {Object.entries(priorities).map(([key, priority]) => (
                                                <option key={key} value={key}>{priority.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option>Tech Team</option>
                                            <option>Support Team</option>
                                            <option>Admin Team</option>
                                            <option>Security Team</option>
                                            <option>Legal Team</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="8"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter tags separated by commas..."
                                    />
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
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Task
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

export default AdminTasksManagement;