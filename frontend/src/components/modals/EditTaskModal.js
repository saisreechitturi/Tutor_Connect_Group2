import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle } from 'lucide-react';
import { taskService } from '../../services';

const EditTaskModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        priority: 'medium',
        dueDate: '',
        estimatedDuration: 60, // in minutes
        tags: []
    });

    const [tagInput, setTagInput] = useState('');

    const priorityOptions = [
        { value: 'low', label: 'Low Priority', color: 'text-green-600' },
        { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
        { value: 'high', label: 'High Priority', color: 'text-red-600' },
        { value: 'urgent', label: 'Urgent', color: 'text-red-800' }
    ];

    // Initialize form data when task changes
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                subject: task.subject || '',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                estimatedDuration: task.estimatedHours ? task.estimatedHours * 60 : 60,
                tags: task.tags || []
            });
        }
    }, [task]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user makes changes
        setError(null);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            handleInputChange('tags', [...formData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Task title is required');
            return false;
        }
        if (!formData.dueDate) {
            setError('Due date is required');
            return false;
        }
        // Allow today's date and future dates
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999); // End of yesterday

        const selectedDate = new Date(formData.dueDate);
        if (selectedDate <= yesterday) {
            setError('Due date cannot be in the past');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            const updateData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                subject: formData.subject.trim(),
                priority: formData.priority,
                dueDate: formData.dueDate,
                estimatedHours: formData.estimatedDuration / 60, // Convert minutes to hours
                tags: formData.tags
            };

            await taskService.updateTask(task.id, updateData);

            // Create updated task object for callback
            const updatedTask = {
                ...task,
                ...updateData,
                estimatedHours: updateData.estimatedHours
            };

            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
            }

            // Close modal
            onClose();
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err.message || 'Failed to update task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setTagInput('');
        onClose();
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-primary-600" />
                        Edit Task
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-700 text-sm">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            disabled={loading}
                            placeholder="Enter task title..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            className="input-field"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            disabled={loading}
                            placeholder="Describe your task..."
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            disabled={loading}
                            placeholder="Enter subject..."
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            className="input-field"
                            value={formData.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            disabled={loading}
                        >
                            {priorityOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date and Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due Date *
                            </label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={formData.dueDate}
                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Estimated Duration (minutes)
                            </label>
                            <input
                                type="number"
                                min="15"
                                step="15"
                                className="input-field"
                                value={formData.estimatedDuration}
                                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-md"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 text-primary-600 hover:text-primary-800"
                                        disabled={loading}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input-field flex-1"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Add tag..."
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                                disabled={loading || !tagInput.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
                            disabled={loading}
                        >
                            {loading && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            )}
                            {loading ? 'Updating...' : 'Update Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;