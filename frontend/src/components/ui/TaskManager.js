import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Clock, Calendar, Filter, X, AlertCircle } from 'lucide-react';
import { taskService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import AddTaskModal from '../modals/AddTaskModal';
import TaskDetailsModal from '../modals/TaskDetailsModal';

const TaskManager = () => {
    const { user } = useAuth();
    const [userTasks, setUserTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('due_date');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);

    const handleTaskAdded = (newTask) => {
        setUserTasks(prev => [...prev, newTask]);
    };

    const handleTaskUpdated = (updatedTask) => {
        setUserTasks(prev => prev.map(task =>
            task.id === updatedTask.id ? updatedTask : task
        ));
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                setError(null);
                const tasksData = await taskService.getTasks();
                setUserTasks(tasksData);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                setError('Failed to load tasks. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchTasks();
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                        <p className="text-gray-600 mt-1">Organize and track your study tasks</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary mt-4 sm:mt-0 inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </button>
                </div>

                {/* Error Display */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                        <div className="text-red-600">
                            <h3 className="font-medium">Error loading tasks</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                window.location.reload();
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                </div>

                {/* Add Task Modal */}
                <AddTaskModal
                    isOpen={showAddForm}
                    onClose={() => setShowAddForm(false)}
                    onTaskAdded={handleTaskAdded}
                />
            </div>
        );
    }

    const filteredTasks = userTasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === 'pending';
        if (filter === 'in-progress') return task.status === 'in-progress';
        if (filter === 'completed') return task.status === 'completed';
        return true;
    }).sort((a, b) => {
        if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (sortBy === 'progress') return b.progress - a.progress;
        return 0;
    });

    const toggleTaskStatus = async (taskId) => {
        try {
            const task = userTasks.find(t => t.id === taskId);
            if (!task) return;

            // Optimistically update UI first
            let updateData = {};
            if (task.status === 'pending') {
                updateData.status = 'in-progress';
            } else if (task.status === 'in-progress') {
                updateData.status = 'completed';
                updateData.progress = 100;
            } else {
                updateData.status = 'pending';
                updateData.progress = 0;
            }

            // Update local state immediately for better UX
            setUserTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    return { ...t, ...updateData };
                }
                return t;
            }));

            // Try to update on server
            try {
                await taskService.updateTask(taskId, updateData);
                // Clear any existing errors on success
                setError(null);
            } catch (apiError) {
                // Revert the optimistic update on API failure
                setUserTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        return task; // Revert to original task state
                    }
                    return t;
                }));

                console.error('Failed to update task on server:', apiError);
                setUpdateError('Failed to update task. Please check your internet connection and try again.');
                // Auto-dismiss error after 5 seconds
                setTimeout(() => setUpdateError(null), 5000);
            }
        } catch (error) {
            console.error('Failed to update task:', error);
            setUpdateError('Failed to update task. Please try again.');
            // Auto-dismiss error after 5 seconds
            setTimeout(() => setUpdateError(null), 5000);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'in-progress': return 'text-blue-600';
            case 'pending': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    const isOverdue = (dueDate, status) => {
        return status !== 'completed' && new Date(dueDate) < new Date();
    };

    return (
        <div className="space-y-6">
            {/* Inline Update Error Notification */}
            {updateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-red-800 font-medium text-sm">Task Update Failed</h3>
                            <p className="text-red-600 text-sm mt-1">{updateError}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setUpdateError(null)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                    <p className="text-gray-600 mt-1">Organize and track your study tasks</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary mt-4 sm:mt-0 inline-flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                </button>
            </div>

            {/* Filters and Sorting */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Filter className="h-4 w-4 text-gray-500 mr-2" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                            >
                                <option value="all">All Tasks</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                            >
                                <option value="dueDate">Sort by Due Date</option>
                                <option value="priority">Sort by Priority</option>
                                <option value="progress">Sort by Progress</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        {filteredTasks.length} of {userTasks.length} tasks
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${isOverdue(task.dueDate, task.status) ? 'border-l-red-500 bg-red-50' :
                            task.status === 'completed' ? 'border-l-green-500' :
                                task.status === 'in-progress' ? 'border-l-blue-500' :
                                    'border-l-gray-300'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskStatus(task.id);
                                    }}
                                    className={`mt-1 ${getStatusColor(task.status)} hover:scale-110 transition-transform`}
                                >
                                    {task.status === 'completed' ? (
                                        <CheckSquare className="h-5 w-5" />
                                    ) : (
                                        <Square className="h-5 w-5" />
                                    )}
                                </button>

                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleTaskClick(task)}
                                >
                                    <h3 className={`font-semibold text-gray-900 hover:text-blue-600 transition-colors ${task.status === 'completed' ? 'line-through text-gray-500' : ''
                                        }`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                                            {task.priority} priority
                                        </span>

                                        <span className="text-sm text-gray-500 flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </span>

                                        <span className="text-sm text-gray-500 flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {task.estimatedHours}h estimated
                                        </span>

                                        <span className="text-sm text-gray-500">
                                            {task.category}
                                        </span>
                                    </div>

                                    {task.status !== 'completed' && task.progress > 0 && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Progress</span>
                                                <span>{task.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isOverdue(task.dueDate, task.status) && (
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                    Overdue
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-4">
                        {filter === 'all' ? "You haven't added any tasks yet." : `No ${filter} tasks found.`}
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary"
                    >
                        Add Your First Task
                    </button>
                </div>
            )}

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                onTaskAdded={handleTaskAdded}
            />

            {/* Task Details Modal */}
            <TaskDetailsModal
                isOpen={showTaskDetails}
                onClose={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onTaskUpdated={handleTaskUpdated}
            />
        </div>
    );
};

export default TaskManager;