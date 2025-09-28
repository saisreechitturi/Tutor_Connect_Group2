import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, CheckCircle, AlertCircle, User, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services';

const TutorTasks = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [user?.id]);

    const fetchTasks = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);
            const tasksData = await taskService.getUserTasks(user.id);
            setTasks(tasksData || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks. Please try again.');
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
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg p-6">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
                        <h3 className="text-red-800 font-medium">Error loading tasks</h3>
                        <p className="text-red-600 mt-1">{error}</p>
                        <button
                            onClick={fetchTasks}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredTasks = tasks.filter(task => {
        const matchesTab = activeTab === 'all' || task.status === activeTab;
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.subject.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'review': return <BookOpen className="h-4 w-4" />;
            case 'preparation': return <Edit className="h-4 w-4" />;
            case 'grading': return <CheckCircle className="h-4 w-4" />;
            case 'follow-up': return <User className="h-4 w-4" />;
            default: return <BookOpen className="h-4 w-4" />;
        }
    };

    const updateTaskStatus = (taskId, newStatus) => {
        setTaskList(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    };

    const deleteTask = (taskId) => {
        setTaskList(prev => prev.filter(task => task.id !== taskId));
    };

    const TaskCard = ({ task }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                        {getTypeIcon(task.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                                <img
                                    src={task.student.avatar}
                                    alt={task.student.name}
                                    className="h-4 w-4 rounded-full"
                                />
                                <span>{task.student.name}</span>
                            </div>
                            <span>{task.subject}</span>
                            <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{task.estimatedTime}h</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                    </span>
                    <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {task.status === 'pending' && (
                        <button
                            onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                            Start
                        </button>
                    )}
                    {task.status === 'in-progress' && (
                        <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                            Complete
                        </button>
                    )}
                    <button
                        onClick={() => setSelectedTask(task)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {task.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">{task.notes}</p>
                </div>
            )}
        </div>
    );

    const CreateTaskModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                        <input type="text" className="input-field" placeholder="Enter task title..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea rows={3} className="input-field" placeholder="Describe the task..."></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                            <select className="input-field">
                                <option>Select a student...</option>
                                <option>Sai Prathyusha Celoth</option>
                                <option>Chandan Cheni</option>
                                <option>Maatheswaran Kannan Chellapandian</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                            <input type="text" className="input-field" placeholder="e.g. JavaScript, React..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select className="input-field">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select className="input-field">
                                <option value="preparation">Preparation</option>
                                <option value="review">Review</option>
                                <option value="grading">Grading</option>
                                <option value="follow-up">Follow-up</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (hours)</label>
                            <input type="number" step="0.5" className="input-field" placeholder="1.5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input type="date" className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea rows={2} className="input-field" placeholder="Additional notes..."></textarea>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={() => setShowCreateModal(false)}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button className="btn-primary">Create Task</button>
                </div>
            </div>
        </div>
    );

    const taskCounts = {
        all: taskList.length,
        pending: taskList.filter(t => t.status === 'pending').length,
        'in-progress': taskList.filter(t => t.status === 'in-progress').length,
        completed: taskList.filter(t => t.status === 'completed').length
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-600 mt-1">Manage your tutoring tasks and assignments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Task</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-2xl font-bold text-gray-900">{taskCounts.all}</p>
                            <p className="text-sm text-gray-600">Total Tasks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                            <p className="text-2xl font-bold text-gray-900">{taskCounts.pending}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                        <div className="ml-3">
                            <p className="text-2xl font-bold text-gray-900">{taskCounts['in-progress']}</p>
                            <p className="text-sm text-gray-600">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                            <p className="text-2xl font-bold text-gray-900">{taskCounts.completed}</p>
                            <p className="text-sm text-gray-600">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 input-field"
                        />
                    </div>
                    <div className="flex space-x-2">
                        {['all', 'pending', 'in-progress', 'completed'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({taskCounts[tab]})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        Create Your First Task
                    </button>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && <CreateTaskModal />}
        </div>
    );
};

export default TutorTasks;