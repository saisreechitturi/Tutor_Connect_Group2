import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, Tag, AlertCircle } from 'lucide-react';
import { taskService } from '../../services';

const AddTaskModal = ({ isOpen, onClose, onTaskAdded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'General Studies',
        priority: 'medium',
        dueDate: '',
        estimatedDuration: 60, // in minutes
        tags: []
    });

    const [tagInput, setTagInput] = useState('');

    const taskCategories = [
        'General Studies',
        'Mathematics',
        'Science',
        'English',
        'History',
        'Computer Science',
        'Languages',
        'Arts',
        'Music',
        'Sports',
        'Other'
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low Priority', color: 'text-green-600' },
        { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
        { value: 'high', label: 'High Priority', color: 'text-red-600' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
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
        if (new Date(formData.dueDate) < new Date()) {
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

            const taskData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
                priority: formData.priority,
                dueDate: formData.dueDate,
                estimatedDuration: formData.estimatedDuration,
                tags: formData.tags
            };

            const newTask = await taskService.createTask(taskData);

            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'General Studies',
                priority: 'medium',
                dueDate: '',
                estimatedDuration: 60,
                tags: []
            });

            // Notify parent component
            if (onTaskAdded) {
                onTaskAdded(newTask);
            }

            // Close modal
            onClose();
        } catch (err) {
            console.error('Error creating task:', err);
            setError(err.message || 'Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            category: 'General Studies',
            priority: 'medium',
            dueDate: '',
            estimatedDuration: 60,
            tags: []
        });
        setError(null);
        setTagInput('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-primary-600" />
                        Add New Task
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
                            placeholder="Enter task title..."
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            className="input-field"
                            rows="3"
                            placeholder="Describe the task in detail..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                className="input-field"
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                disabled={loading}
                            >
                                {taskCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

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
                                {priorityOptions.map(priority => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
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
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="btn-secondary"
                                disabled={loading || !tagInput.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;