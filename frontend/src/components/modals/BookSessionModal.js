import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, User, MapPin, Video, AlertCircle, CheckCircle, Book } from 'lucide-react';
import { sessionService, tutorService, availabilityService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const BookSessionModal = ({ isOpen, onClose, onSessionBooked, selectedTutor = null }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [tutorsLoading, setTutorsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [availableTutors, setAvailableTutors] = useState([]);
    const [tutorDetails, setTutorDetails] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [formData, setFormData] = useState({
        tutorId: selectedTutor?.id || '',
        title: '',
        description: '',
        subjectId: '',
        sessionType: 'online',
        scheduledDate: '',
        scheduledTime: '',
        durationMinutes: 60,
        hourlyRate: selectedTutor?.hourlyRate || 0,
        meetingLink: '',
        locationAddress: ''
    });

    const sessionTypes = [
        { value: 'online', label: 'Online Session', icon: Video },
        { value: 'in-person', label: 'In-Person Session', icon: MapPin }
    ];

    const durationOptions = [
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
        { value: 180, label: '3 hours' }
    ];

    // Load tutors when modal opens (if no specific tutor selected)
    useEffect(() => {
        if (isOpen && !selectedTutor) {
            fetchTutors();
        }
    }, [isOpen, selectedTutor]);

    // Load tutor details when tutor is selected
    useEffect(() => {
        if (formData.tutorId) {
            fetchTutorDetails(formData.tutorId);
        } else {
            setTutorDetails(null);
        }
    }, [formData.tutorId]);

    // Load available slots when date/duration changes
    useEffect(() => {
        if (formData.tutorId && formData.scheduledDate && formData.durationMinutes) {
            fetchAvailableSlots();
        } else {
            setAvailableSlots([]);
        }
    }, [formData.tutorId, formData.scheduledDate, formData.durationMinutes]);

    // Set initial data when modal opens with selected tutor
    useEffect(() => {
        if (selectedTutor && isOpen) {
            setFormData(prev => ({
                ...prev,
                tutorId: selectedTutor.id,
                hourlyRate: selectedTutor.hourlyRate || 0
            }));
        }
    }, [selectedTutor, isOpen]);

    const fetchTutors = async () => {
        try {
            setTutorsLoading(true);
            const response = await tutorService.getTutors();
            setAvailableTutors(response || []);
        } catch (err) {
            console.error('Error fetching tutors:', err);
            setError('Failed to load tutors. Please try again.');
        } finally {
            setTutorsLoading(false);
        }
    };

    const fetchTutorDetails = async (tutorId) => {
        try {
            const response = await tutorService.getTutorDetails(tutorId);
            setTutorDetails(response);

            // Update hourly rate from tutor details
            if (response.tutor?.hourlyRate) {
                setFormData(prev => ({
                    ...prev,
                    hourlyRate: response.tutor.hourlyRate
                }));
            }
        } catch (err) {
            console.error('Error fetching tutor details:', err);
            setError('Failed to load tutor details. Please try again.');
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            setSlotsLoading(true);
            setError(null);

            const response = await availabilityService.getAvailableTimeSlots(formData.tutorId, {
                date: formData.scheduledDate,
                duration: formData.durationMinutes
            });

            setAvailableSlots(response.availableSlots || []);

            if (response.availableSlots?.length === 0) {
                setError('No available slots for the selected date and duration. Please try a different date.');
            }
        } catch (err) {
            console.error('Error fetching available slots:', err);
            setError('Failed to check availability. Please try again.');
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear selected time when date or duration changes
        if (field === 'scheduledDate' || field === 'durationMinutes') {
            setFormData(prev => ({
                ...prev,
                scheduledTime: ''
            }));
        }

        // Clear error when user starts typing
        if (error) setError(null);
        if (success) setSuccess(false);
    };

    const validateForm = () => {
        if (!formData.tutorId) {
            setError('Please select a tutor');
            return false;
        }
        if (!formData.title.trim()) {
            setError('Session title is required');
            return false;
        }
        if (!formData.subjectId) {
            setError('Please select a subject');
            return false;
        }
        if (!formData.scheduledDate) {
            setError('Please select a date');
            return false;
        }
        if (!formData.scheduledTime) {
            setError('Please select a time slot');
            return false;
        }

        // Check if the scheduled time is in the future
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
            setError('Scheduled time must be in the future');
            return false;
        }

        // Validate session type specific fields
        if (formData.sessionType === 'online' && !formData.meetingLink.trim()) {
            setError('Meeting link is required for online sessions');
            return false;
        }
        if (formData.sessionType === 'in-person' && !formData.locationAddress.trim()) {
            setError('Location address is required for in-person sessions');
            return false;
        }

        return true;
    };

    const calculateTotalCost = () => {
        const hours = formData.durationMinutes / 60;
        return (formData.hourlyRate * hours).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
            const endDateTime = new Date(scheduledDateTime.getTime() + formData.durationMinutes * 60000);

            const sessionData = {
                tutorId: parseInt(formData.tutorId),
                subjectId: parseInt(formData.subjectId),
                title: formData.title.trim(),
                description: formData.description.trim(),
                sessionType: formData.sessionType,
                scheduledStart: scheduledDateTime.toISOString(),
                scheduledEnd: endDateTime.toISOString(),
                hourlyRate: formData.hourlyRate,
                meetingLink: formData.sessionType === 'online' ? formData.meetingLink.trim() : null,
                locationAddress: formData.sessionType === 'in-person' ? formData.locationAddress.trim() : null
            };

            const newSession = await sessionService.createSession(sessionData);

            setSuccess(true);

            // Show success toast
            try {
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: {
                        type: 'success',
                        title: 'Session booked successfully!',
                        message: `Your session "${formData.title.trim()}" has been scheduled.`
                    }
                }));
            } catch (toastError) {
                console.warn('Failed to show toast:', toastError);
            }

            // Notify parent component
            if (onSessionBooked) {
                onSessionBooked(newSession);
            }

            // Close modal after a short delay
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            console.error('Error booking session:', err);
            const msg = (err?.message || '').toLowerCase();
            if (msg.includes('conflict') || msg.includes('not available') || msg.includes('overlap')) {
                setError('The selected time slot is no longer available. Please choose a different time.');
            } else {
                setError(err.message || 'Failed to book session. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            tutorId: selectedTutor?.id || '',
            title: '',
            description: '',
            subjectId: '',
            sessionType: 'online',
            scheduledDate: '',
            scheduledTime: '',
            durationMinutes: 60,
            hourlyRate: selectedTutor?.hourlyRate || 0,
            meetingLink: '',
            locationAddress: ''
        });
        setError(null);
        setSuccess(false);
        setTutorDetails(null);
        setAvailableSlots([]);
        onClose();
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Book a Tutoring Session
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            <div>
                                <p className="text-green-800 font-medium">Session booked successfully!</p>
                                <p className="text-green-700 text-sm">You will receive a confirmation email shortly.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Tutor Selection */}
                                {!selectedTutor && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Tutor *
                                        </label>
                                        {tutorsLoading ? (
                                            <div className="p-3 text-gray-500 text-center">Loading tutors...</div>
                                        ) : (
                                            <select
                                                value={formData.tutorId}
                                                onChange={(e) => handleInputChange('tutorId', e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Choose a tutor...</option>
                                                {availableTutors.map(tutor => (
                                                    <option key={tutor.id} value={tutor.id}>
                                                        {tutor.name} - ${tutor.hourlyRate}/hr ({tutor.rating}⭐)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* Selected Tutor Info */}
                                {(selectedTutor || tutorDetails) && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <User className="h-5 w-5 text-blue-600 mr-2" />
                                            <h3 className="font-medium text-blue-900">
                                                {selectedTutor?.name || tutorDetails?.tutor?.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-blue-700 mb-2">
                                            ${selectedTutor?.hourlyRate || tutorDetails?.tutor?.hourlyRate}/hr •
                                            {selectedTutor?.rating || tutorDetails?.tutor?.rating}⭐ •
                                            {selectedTutor?.totalSessions || tutorDetails?.tutor?.totalSessions} sessions
                                        </p>
                                        {(selectedTutor?.bio || tutorDetails?.tutor?.bio) && (
                                            <p className="text-sm text-blue-600">
                                                {selectedTutor?.bio || tutorDetails?.tutor?.bio}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Subject Selection */}
                                {tutorDetails?.subjects && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject *
                                        </label>
                                        <select
                                            value={formData.subjectId}
                                            onChange={(e) => handleInputChange('subjectId', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Choose a subject...</option>
                                            {tutorDetails.subjects.map(subject => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.name} ({subject.proficiency})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Session Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="e.g., Algebra Review Session"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Describe what you'd like to focus on in this session..."
                                        rows={3}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Session Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Type *
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {sessionTypes.map(type => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => handleInputChange('sessionType', type.value)}
                                                    className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center ${formData.sessionType === type.value
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Online Session - Meeting Link */}
                                {formData.sessionType === 'online' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Link *
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.meetingLink}
                                            onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                                            placeholder="https://zoom.us/j/123456789 or Google Meet link"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                )}

                                {/* In-Person Session - Location */}
                                {formData.sessionType === 'in-person' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Location *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.locationAddress}
                                            onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                                            placeholder="Library, coffee shop, campus building, etc."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration *
                                    </label>
                                    <select
                                        value={formData.durationMinutes}
                                        onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        {durationOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                        min={getMinDate()}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Available Time Slots */}
                                {formData.scheduledDate && formData.tutorId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Available Time Slots *
                                        </label>
                                        {slotsLoading ? (
                                            <div className="p-4 text-center text-gray-500">
                                                <Clock className="h-5 w-5 mx-auto mb-2 animate-spin" />
                                                Checking availability...
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                {availableSlots.map((slot, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleInputChange('scheduledTime', slot.startTime)}
                                                        className={`p-2 text-sm rounded border-2 transition-colors ${formData.scheduledTime === slot.startTime
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {slot.startTime}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                                No available slots for selected date and duration
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cost Summary */}
                                {formData.hourlyRate > 0 && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <DollarSign className="h-5 w-5 text-gray-600 mr-2" />
                                            <h3 className="font-medium text-gray-900">Cost Summary</h3>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                                <span>Duration:</span>
                                                <span>{formData.durationMinutes} minutes</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Hourly Rate:</span>
                                                <span>${formData.hourlyRate}/hr</span>
                                            </div>
                                            <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                                                <span>Total Cost:</span>
                                                <span>${calculateTotalCost()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${loading || success
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                            >
                                {loading ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Booking...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Booked!
                                    </>
                                ) : (
                                    <>
                                        <Book className="h-4 w-4 mr-2" />
                                        Book Session
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookSessionModal;