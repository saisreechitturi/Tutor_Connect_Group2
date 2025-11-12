import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { availabilityService } from '../services';
import { useAuth } from '../context/AuthContext';
import { DAY_OF_WEEK_MIN, DAY_OF_WEEK_MAX } from '../constants/schema';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TutorAvailability = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('weekly');
    const [recurringSlots, setRecurringSlots] = useState([]);
    const [specificSlots, setSpecificSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

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
            setRecurringSlots(data.availability?.recurringSlots || []);
            setSpecificSlots(data.availability?.specificSlots || []);
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
                    Set your weekly schedule and manage specific date overrides
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`${activeTab === 'weekly'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        <Clock className="h-5 w-5 inline-block mr-2" />
                        Weekly Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('specific')}
                        className={`${activeTab === 'specific'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        <CalendarIcon className="h-5 w-5 inline-block mr-2" />
                        Specific Dates
                    </button>
                </nav>
            </div>

            {/* Weekly Schedule Tab */}
            {activeTab === 'weekly' && (
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
                                const daySlots = recurringSlots.filter(slot => slot.dayOfWeek === index);
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
                                                                Max {slot.maxSessions} session{slot.maxSessions > 1 ? 's' : ''} •
                                                                {slot.bufferMinutes}min buffer
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
            )}

            {/* Specific Dates Tab */}
            {activeTab === 'specific' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Specific Date Overrides</h2>
                        <button
                            onClick={handleAddSlot}
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Date Override
                        </button>
                    </div>

                    {specificSlots.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No specific date overrides set</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Use date overrides to block time off or add extra availability on specific dates
                            </p>
                            <button
                                onClick={handleAddSlot}
                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Date Override
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {specificSlots.map(slot => (
                                <div
                                    key={slot.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {new Date(`${slot.date}T00:00:00Z`).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    timeZone: 'UTC'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {slot.startTime} - {slot.endTime}
                                                {slot.isAvailable ? ' (Available)' : ' (Blocked)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEditSlot(slot)}
                                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                                            aria-label="Edit override"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                                            aria-label="Delete override"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <SlotModal
                    isOpen={showAddModal}
                    onClose={handleCloseModal}
                    onSave={handleSaveSlot}
                    slot={editingSlot}
                    tutorId={user.id}
                    isWeekly={activeTab === 'weekly'}
                />
            )}
        </div>
    );
};

// Slot Modal Component
const SlotModal = ({ isOpen, onClose, onSave, slot, tutorId, isWeekly }) => {
    const [formData, setFormData] = useState({
        dayOfWeek: slot?.dayOfWeek ?? 1,
        date: slot?.date || '',
        startTime: slot?.startTime || '09:00',
        endTime: slot?.endTime || '10:00',
        maxSessions: slot?.maxSessions || 1,
        bufferMinutes: slot?.bufferMinutes || 15,
        isAvailable: slot?.isAvailable ?? true
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

        if (isWeekly && (formData.dayOfWeek < DAY_OF_WEEK_MIN || formData.dayOfWeek > DAY_OF_WEEK_MAX)) {
            setValidationError(`Day of week must be between ${DAY_OF_WEEK_MIN} and ${DAY_OF_WEEK_MAX}`);
            return;
        }

        if (!isWeekly && !formData.date) {
            setValidationError('Date is required for specific overrides');
            return;
        }

        try {
            setSaving(true);

            if (slot) {
                // Update existing slot
                await availabilityService.updateSlot(tutorId, slot.id, {
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    maxSessions: formData.maxSessions,
                    bufferMinutes: formData.bufferMinutes,
                    ...(slot.date && { isAvailable: formData.isAvailable })
                });
            } else {
                // Create new slot
                if (isWeekly) {
                    await availabilityService.createRecurringSlot(tutorId, {
                        dayOfWeek: formData.dayOfWeek,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                        maxSessions: formData.maxSessions,
                        bufferMinutes: formData.bufferMinutes
                    });
                } else {
                    await availabilityService.createSpecificSlot(tutorId, {
                        date: formData.date,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                        isAvailable: formData.isAvailable,
                        maxSessions: formData.maxSessions,
                        bufferMinutes: formData.bufferMinutes
                    });
                }
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
                    {slot ? 'Edit' : 'Add'} {isWeekly ? 'Weekly' : 'Specific Date'} Availability
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {validationError && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                            {validationError}
                        </div>
                    )}

                    {isWeekly ? (
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
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={!!slot}
                                required
                            />
                        </div>
                    )}

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

                    {!isWeekly && (
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Available (uncheck to block this time)</span>
                            </label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Sessions
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.maxSessions}
                                onChange={(e) => setFormData({ ...formData, maxSessions: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buffer (min)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="60"
                                step="5"
                                value={formData.bufferMinutes}
                                onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) })}
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
