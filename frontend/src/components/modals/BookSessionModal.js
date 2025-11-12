import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, User, MapPin, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { sessionService, tutorService, subjectsService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const BookSessionModal = ({ isOpen, onClose, onSessionBooked, selectedTutor = null }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [tutorsLoading, setTutorsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [availableTutors, setAvailableTutors] = useState([]);

    const [formData, setFormData] = useState({
        tutorId: selectedTutor?.id || '',
        title: '',
        description: '',
        subjectId: null,
        sessionType: 'online', // 'online' or 'in-person'
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

    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        if (isOpen && !selectedTutor) {
            fetchTutors();
        }
    }, [isOpen, selectedTutor]);

    useEffect(() => {
        if (selectedTutor) {
            setFormData(prev => ({
                ...prev,
                tutorId: selectedTutor.id,
                hourlyRate: selectedTutor.hourlyRate || 0
            }));
        }
    }, [selectedTutor]);

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const res = await subjectsService.list({ active: true, limit: 100 });
                setSubjects(res.subjects || []);
            } catch (err) {
                console.warn('Failed to load subjects list', err);
                setSubjects([]);
            }
        };
        if (isOpen) loadSubjects();
    }, [isOpen]);

    const fetchTutors = async () => {
        try {
            setTutorsLoading(true);
            const tutorsData = await tutorService.getTutors();
            setAvailableTutors(tutorsData || []);
        } catch (err) {
            console.error('Error fetching tutors:', err);
            setError('Failed to load tutors. Please try again.');
        } finally {
            setTutorsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Update hourly rate when tutor changes
        if (field === 'tutorId') {
            const selectedTutorData = availableTutors.find(t => t.id === parseInt(value));
            if (selectedTutorData) {
                setFormData(prev => ({
                    ...prev,
                    hourlyRate: selectedTutorData.hourlyRate || 0
                }));
            }
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
        if (!formData.scheduledDate) {
            setError('Please select a date');
            return false;
        }
        if (!formData.scheduledTime) {
            setError('Please select a time');
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
                subjectId: formData.subjectId || null,
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
            setError(err.message || 'Failed to book session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            tutorId: selectedTutor?.id || '',
            title: '',
            description: '',
            subjectId: null,
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
        onClose();
    };

    const getMinDateTime = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const getMinTime = () => {
        const selectedDate = new Date(formData.scheduledDate);
        const today = new Date();

        // If selected date is today, minimum time should be current time + 2 hours
        if (selectedDate.toDateString() === today.toDateString()) {
            const minTime = new Date(today.getTime() + 2 * 60 * 60 * 1000);
            return minTime.toTimeString().slice(0, 5);
        }

        return '00:00';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                        Book a Session
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-700 text-sm">Session booked successfully! You will receive a confirmation email shortly.</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-700 text-sm">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Tutor Selection */}
                    {!selectedTutor && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                Select Tutor *
                            </label>
                            {tutorsLoading ? (
                                <div className="input-field flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                    Loading tutors...
                                </div>
                            ) : (
                                <select
                                    className="input-field"
                                    value={formData.tutorId}
                                    onChange={(e) => handleInputChange('tutorId', e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Choose a tutor...</option>
                                    {availableTutors.map(tutor => (
                                        <option key={tutor.id} value={tutor.id}>
                                            {tutor.firstName} {tutor.lastName} - ${tutor.hourlyRate}/hour
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Selected Tutor Info */}
                    {selectedTutor && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Selected Tutor</h3>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                                    {selectedTutor.firstName?.[0]}{selectedTutor.lastName?.[0]}
                                </div>
                                <div>
                                    <p className="font-medium">{selectedTutor.firstName} {selectedTutor.lastName}</p>
                                    <p className="text-sm text-gray-600">${selectedTutor.hourlyRate}/hour</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session Title and Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Session Title *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="e.g., Math Tutoring Session"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject
                            </label>
                            <select
                                className="input-field"
                                value={formData.subjectId ?? ''}
                                onChange={(e) => handleInputChange('subjectId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={loading}
                            >
                                <option value="">Select a subject...</option>
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            className="input-field"
                            rows="3"
                            placeholder="Describe what you'd like to work on during this session..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            disabled={loading}
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
                                        className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${formData.sessionType === type.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        disabled={loading}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meeting Link (for online sessions) */}
                    {formData.sessionType === 'online' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meeting Link *
                            </label>
                            <input
                                type="url"
                                required
                                className="input-field"
                                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                value={formData.meetingLink}
                                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Location (for in-person sessions) */}
                    {formData.sessionType === 'in-person' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location Address *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="Enter the meeting location address..."
                                value={formData.locationAddress}
                                onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={formData.scheduledDate}
                                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                min={getMinDateTime()}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Time *
                            </label>
                            <input
                                type="time"
                                required
                                className="input-field"
                                value={formData.scheduledTime}
                                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                                min={getMinTime()}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration *
                        </label>
                        <select
                            className="input-field"
                            value={formData.durationMinutes}
                            onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                            disabled={loading}
                        >
                            {durationOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cost Summary */}
                    {formData.hourlyRate > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Cost Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Hourly Rate:</span>
                                    <span>${formData.hourlyRate}/hour</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Duration:</span>
                                    <span>{formData.durationMinutes} minutes</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                    <span>Total Cost:</span>
                                    <span>${calculateTotalCost()}</span>
                                </div>
                            </div>
                        </div>
                    )}

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
                            disabled={loading || success}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Booking...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Booked!
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Book Session
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookSessionModal;