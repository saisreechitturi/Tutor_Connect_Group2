import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Clock, Calendar, Filter, X, AlertCircle, Edit } from 'lucide-react';
import { taskService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import AddTaskModal from '../modals/AddTaskModal';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import EditTaskModal from '../modals/EditTaskModal';

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
    const [showEditModal, setShowEditModal] = useState(false);

    const handleTaskAdded = (response) => {
        // Extract task from response object
        const newTask = response.task || response;
        setUserTasks(prev => [...prev, newTask]);
    };

    const handleTaskUpdated = (updatedTask) => {
        // Normalize the updated task
        const normalized = {
            ...updatedTask,
            progress: updatedTask.status === 'completed' ? 100 : (updatedTask.progress || 0),
            progressPercentage: updatedTask.status === 'completed' ? 100 : (updatedTask.progressPercentage || 0)
        };
        setUserTasks(prev => prev.map(task =>
            task.id === normalized.id ? normalized : task
        ));
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setShowEditModal(true);
    };

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                setError(null);
                const tasksData = await taskService.getTasks();
                // Normalize task data - ensure completed tasks show 100% progress
                const normalizedTasks = tasksData.map(task => ({
                    ...task,
                    progress: task.status === 'completed' ? 100 : (task.progress || 0),
                    progressPercentage: task.status === 'completed' ? 100 : (task.progressPercentage || 0)
                }));
                setUserTasks(normalizedTasks);
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

            // Determine the new status - directly toggle between pending and completed
            let newStatus, newProgress;
            if (task.status === 'completed') {
                // If completed, mark as pending
                newStatus = 'pending';
                newProgress = 0;
            } else {
                // If pending or in-progress, mark as completed
                newStatus = 'completed';
                newProgress = 100;
            }

            // Optimistically update UI first
            const updatedTask = {
                ...task,
                status: newStatus,
                progress: newProgress,
                progressPercentage: newProgress,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : null
            };
            setUserTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

            // Try to update on server using the appropriate endpoint
            try {
                if (newStatus === 'completed') {
                    await taskService.completeTask(taskId);
                } else {
                    await taskService.uncompleteTask(taskId);
                }
                // Clear any existing errors on success
                setError(null);
                setUpdateError(null);
            } catch (apiError) {
                // Revert the optimistic update on API failure
                setUserTasks(prev => prev.map(t => t.id === taskId ? task : t));

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
            case 'urgent': return 'bg-red-200 text-red-900 border-red-300';
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
            <div className="space-y-3">
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${isOverdue(task.dueDate, task.status) ? 'border-l-red-500 bg-red-50' :
                            task.status === 'completed' ? 'border-l-green-500' :
                                task.status === 'in-progress' ? 'border-l-blue-500' :
                                    'border-l-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskStatus(task.id);
                                }}
                                className={`${getStatusColor(task.status)} hover:scale-110 transition-transform flex-shrink-0`}
                            >
                                {task.status === 'completed' ? (
                                    <CheckSquare className="h-5 w-5" />
                                ) : (
                                    <Square className="h-5 w-5" />
                                )}
                            </button>

                            <div
                                className="flex-1 cursor-pointer min-w-0"
                                onClick={() => handleTaskClick(task)}
                            >
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className={`font-semibold text-gray-900 hover:text-blue-600 transition-colors ${task.status === 'completed' ? 'line-through text-gray-500' : ''
                                        }`}>
                                        {task.title}
                                    </h3>
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    {isOverdue(task.dueDate, task.status) && (
                                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                            Overdue
                                        </span>
                                    )}
                                </div>

                                {task.description && (
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-1">{task.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {task.estimatedHours}h
                                    </span>
                                    {task.tags && task.tags.length > 0 && (
                                        <span>{task.tags.join(', ')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Circular Progress Indicator */}
                            {(task.progress > 0 || task.progressPercentage > 0 || task.status === 'completed') ? (
                                <div className="relative flex-shrink-0" title={`${task.status === 'completed' ? 100 : (task.progress || task.progressPercentage)}% complete`}>
                                    <svg className="w-12 h-12 transform -rotate-90">
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="20"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            className="text-gray-200"
                                        />
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="20"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 20}`}
                                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - (task.status === 'completed' ? 100 : (task.progress || task.progressPercentage)) / 100)}`}
                                            className={`${task.status === 'completed' ? 'text-green-600' : 'text-blue-600'} transition-all`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {task.status === 'completed' ? (
                                            <CheckSquare className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <span className="text-xs font-semibold text-gray-700">{task.progress || task.progressPercentage}%</span>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Edit Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                }}
                                className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 ml-2"
                                title="Edit task"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
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
                onEdit={handleEditTask}
            />

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onTaskUpdated={handleTaskUpdated}
            />
        </div>
    );
};

export default TaskManager;