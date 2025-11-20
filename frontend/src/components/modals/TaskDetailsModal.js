import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, FileText, AlertCircle, CheckSquare, Square, Edit } from 'lucide-react';
import { taskService } from '../../services';

const TaskDetailsModal = ({ isOpen, onClose, task, onTaskUpdated, onEdit }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(task?.progress || task?.progressPercentage || 0);
    const [currentStatus, setCurrentStatus] = useState(task?.status || 'pending');

    // Update progress and status when task changes
    useEffect(() => {
        if (task) {
            setProgress(task.progress || task.progressPercentage || 0);
            setCurrentStatus(task.status || 'pending');
        }
    }, [task?.id, task?.progress, task?.progressPercentage, task?.status]);

    if (!isOpen || !task) return null;

    const handleProgressUpdate = async (newProgress) => {
        try {
            setLoading(true);
            setError(null);

            await taskService.updateTaskProgress(task.id, newProgress);

            // Update local state
            setProgress(newProgress);
            const newStatus = newProgress === 100 ? 'completed' : (newProgress > 0 ? 'in-progress' : 'pending');
            setCurrentStatus(newStatus);

            if (onTaskUpdated) {
                onTaskUpdated({
                    ...task,
                    progress: newProgress,
                    progressPercentage: newProgress,
                    status: newStatus,
                    completedAt: newProgress === 100 ? new Date().toISOString() : task.completedAt
                });
            }
        } catch (err) {
            console.error('Failed to update task progress:', err);
            setError('Failed to update progress. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        try {
            setLoading(true);
            setError(null);

            let newStatus;
            let newProgress;

            // If clicking "Mark as Complete", always go to completed
            if (currentStatus !== 'completed') {
                newStatus = 'completed';
                newProgress = 100;
                await taskService.completeTask(task.id);
            } else {
                // If already completed, revert to pending
                newStatus = 'pending';
                newProgress = 0;
                await taskService.uncompleteTask(task.id);
            }

            // Update local state immediately
            setProgress(newProgress);
            setCurrentStatus(newStatus);

            if (onTaskUpdated) {
                onTaskUpdated({
                    ...task,
                    status: newStatus,
                    progress: newProgress,
                    progressPercentage: newProgress,
                    completedAt: newStatus === 'completed' ? new Date().toISOString() : null
                });
            }
        } catch (err) {
            console.error('Failed to update task status:', err);
            setError('Failed to update task status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-200 text-red-900 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
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

    const isOverdue = new Date(task.dueDate) < new Date() && currentStatus !== 'completed';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                            </span>
                            <span className={`text-sm font-medium ${getStatusColor(currentStatus)}`}>
                                {currentStatus}
                            </span>
                            {isOverdue && (
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                    Overdue
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="text-red-800 font-medium text-sm">Error</h3>
                                <p className="text-red-600 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {task.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Description
                            </h3>
                            <p className="text-gray-700 text-sm">{task.description}</p>
                        </div>
                    )}

                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Subject */}
                        {task.subject && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                    <Tag className="h-4 w-4 mr-2" />
                                    Subject
                                </h3>
                                <p className="text-gray-700 text-sm">{task.subject}</p>
                            </div>
                        )}

                        {/* Due Date */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Due Date
                            </h3>
                            <p className="text-gray-700 text-sm">
                                {task.dueDate && !isNaN(new Date(task.dueDate).getTime())
                                    ? new Date(task.dueDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : 'No due date set'
                                }
                            </p>
                        </div>

                        {/* Estimated Time */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Estimated Time
                            </h3>
                            <p className="text-gray-700 text-sm">{task.estimatedHours || task.estimatedDuration || 'N/A'} hours</p>
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {task.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Section */}
                    {currentStatus !== 'completed' && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Progress</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Completion</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex space-x-2">
                                    {[0, 25, 50, 75, 100].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => handleProgressUpdate(value)}
                                            disabled={loading}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${progress === value
                                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {value}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    <button
                        onClick={handleStatusToggle}
                        disabled={loading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            } ${currentStatus === 'completed'
                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                            }`}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : currentStatus === 'completed' ? (
                            <CheckSquare className="h-4 w-4" />
                        ) : (
                            <Square className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                            {loading ? 'Updating...' : currentStatus === 'completed' ? 'Completed ✓' : 'Mark as Complete'}
                        </span>
                    </button>

                    <div className="flex space-x-3">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(task);
                                }}
                                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Task
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;