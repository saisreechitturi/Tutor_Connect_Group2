import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { availabilityService } from '../services';
import { useAuth } from '../context/AuthContext';
import { DAY_OF_WEEK_MIN, DAY_OF_WEEK_MAX } from '../constants/schema';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TutorAvailability = () => {
    const { user } = useAuth();
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [recurringSlots, setRecurringSlots] = useState([]);

    useEffect(() => {
        if (user?.id) {
            loadAvailability();
        }
    }, [user]);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await availabilityService.getAvailability(user.id, {
                includeBooked: false
            });
            const recurring = data.availability?.recurringSlots || [];
            setAvailabilitySlots(recurring);
            setRecurringSlots(recurring);
        } catch (err) {
            console.error('Failed to load availability', err);
            setError(err.message || 'Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = () => {
        setEditingSlot(null);
        setShowAddModal(true);
    };

    const handleEditSlot = (slot) => {
        setEditingSlot(slot);
        setShowAddModal(true);
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to delete this availability slot? This cannot be undone.')) {
            return;
        }

        try {
            await availabilityService.deleteSlot(user.id, slotId);
            await loadAvailability();
        } catch (err) {
            alert(err.message || 'Failed to delete slot');
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingSlot(null);
    };

    const handleSaveSlot = async () => {
        await loadAvailability();
        handleCloseModal();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading availability...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadAvailability}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
                <p className="mt-2 text-gray-600">
                    Set your weekly recurring schedule for tutoring availability
                </p>
            </div>



            {/* Weekly Schedule */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recurring Weekly Availability</h2>
                    <button
                        onClick={handleAddSlot}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time Slot
                    </button>
                </div>

                {recurringSlots.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No weekly availability set</p>
                        <button
                            onClick={handleAddSlot}
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Time Slot
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {DAYS_OF_WEEK.map((day, index) => {
                            const daySlots = availabilitySlots.filter(slot => slot.dayOfWeek === index);
                            if (daySlots.length === 0) return null;

                            return (
                                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">{day}</h3>
                                    <div className="space-y-2">
                                        {daySlots.map(slot => (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between bg-gray-50 rounded p-3"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Clock className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {slot.startTime} - {slot.endTime}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Available for tutoring sessions
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEditSlot(slot)}
                                                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                                                        aria-label="Edit slot"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                                                        aria-label="Delete slot"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <SlotModal
                    isOpen={showAddModal}
                    onClose={handleCloseModal}
                    onSave={handleSaveSlot}
                    slot={editingSlot}
                    tutorId={user?.id}
                />
            )}
        </div>
    );
};

// Slot Modal Component
const SlotModal = ({ isOpen, onClose, onSave, slot, tutorId }) => {
    // Helper function to convert HH:MM:SS to HH:MM
    const formatTimeForInput = (time) => {
        if (!time) return '';
        // If time already in HH:MM format, return as is
        if (time.length === 5) return time;
        // If time in HH:MM:SS format, remove seconds
        return time.substring(0, 5);
    };

    const [formData, setFormData] = useState({
        dayOfWeek: slot?.dayOfWeek ?? 1,
        startTime: formatTimeForInput(slot?.startTime) || '09:00',
        endTime: formatTimeForInput(slot?.endTime) || '10:00'
    });
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError(null);

        // Validate
        if (formData.startTime >= formData.endTime) {
            setValidationError('Start time must be before end time');
            return;
        }

        if (formData.dayOfWeek < DAY_OF_WEEK_MIN || formData.dayOfWeek > DAY_OF_WEEK_MAX) {
            setValidationError(`Day of week must be between ${DAY_OF_WEEK_MIN} and ${DAY_OF_WEEK_MAX}`);
            return;
        }

        try {
            setSaving(true);

            if (slot) {
                // Update existing slot
                await availabilityService.updateSlot(tutorId, slot.id, {
                    startTime: formData.startTime,
                    endTime: formData.endTime
                });
            } else {
                // Create new slot
                await availabilityService.createRecurringSlot(tutorId, {
                    dayOfWeek: formData.dayOfWeek,
                    startTime: formData.startTime,
                    endTime: formData.endTime
                });
            }

            onSave();
        } catch (err) {
            setValidationError(err.message || 'Failed to save slot');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {slot ? 'Edit' : 'Add'} Weekly Availability
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {validationError && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                            {validationError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Day of Week
                        </label>
                        <select
                            value={formData.dayOfWeek}
                            onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={!!slot}
                        >
                            {DAYS_OF_WEEK.map((day, index) => (
                                <option key={index} value={index}>{day}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (slot ? 'Update' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TutorAvailability;
