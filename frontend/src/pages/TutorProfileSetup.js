import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    User,
    BookOpen,
    DollarSign,
    Calendar,
    Save,
    ChevronRight,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

const TutorProfileSetup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profileData, setProfileData] = useState({
        // Basic Info
        yearsOfExperience: '',
        hourlyRate: '',
        educationBackground: '',
        certifications: '',
        languagesSpoken: ['English'],

        // Teaching Details
        teachingPhilosophy: '',
        preferredTeachingMethod: '',

        // Subjects (will be handled separately)
        subjects: [],

        // Availability
        availability: {
            monday: { available: false, slots: [] },
            tuesday: { available: false, slots: [] },
            wednesday: { available: false, slots: [] },
            thursday: { available: false, slots: [] },
            friday: { available: false, slots: [] },
            saturday: { available: false, slots: [] },
            sunday: { available: false, slots: [] }
        }
    });

    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    useEffect(() => {
        // Redirect if not a tutor
        if (user && user.role !== 'tutor') {
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/student');
            }
            return;
        }

        // Fetch available subjects
        fetchSubjects();
    }, [user, navigate]);

    const fetchSubjects = async () => {
        try {
            console.log('Fetching subjects from /api/subjects...');
            const token = localStorage.getItem('token');
            console.log('Auth token present:', !!token);

            const response = await fetch('/api/subjects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            console.log('Subjects API response status:', response.status);
            console.log('Subjects API response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('Subjects API response data:', data);

                // Handle the correct API response format
                if (data && Array.isArray(data.subjects)) {
                    console.log('Setting subjects from data.subjects:', data.subjects.length, 'items');
                    setSubjects(data.subjects);
                } else if (Array.isArray(data)) {
                    // Fallback for different response format
                    console.log('Setting subjects from direct array:', data.length, 'items');
                    setSubjects(data);
                } else {
                    console.error('Invalid subjects data format:', data);
                    // Provide fallback subjects if API doesn't return expected format
                    setSubjects(getFallbackSubjects());
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch subjects:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                setSubjects(getFallbackSubjects());
            }
        } catch (error) {
            console.error('Failed to fetch subjects - network error:', error);
            setSubjects(getFallbackSubjects());
        }
    };

    // Fallback subjects when API is not available
    const getFallbackSubjects = () => [
        {
            id: '5300be37-5643-4372-98c7-3c468655c838',
            name: 'Mathematics',
            description: 'Basic to advanced mathematics including algebra, calculus, and statistics',
            category: 'academics'
        },
        {
            id: '886240f2-186d-4f7c-8a6a-89b41d11adca',
            name: 'Physics',
            description: 'Physics concepts from basic mechanics to advanced quantum physics',
            category: 'science'
        },
        {
            id: '95b21b45-c123-4d56-8e9f-a1b2c3d4e5f6',
            name: 'Spanish',
            description: 'Spanish language learning from beginner to advanced levels',
            category: 'language'
        },
        {
            id: 'b59cf17e-6bdf-4de9-b775-7a55609eb1c6',
            name: 'Computer Science',
            description: 'Programming, algorithms, data structures, and software development',
            category: 'technology'
        }
    ];

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLanguageChange = (index, value) => {
        const newLanguages = [...profileData.languagesSpoken];
        newLanguages[index] = value;
        setProfileData(prev => ({
            ...prev,
            languagesSpoken: newLanguages
        }));
    };

    const addLanguage = () => {
        setProfileData(prev => ({
            ...prev,
            languagesSpoken: [...prev.languagesSpoken, '']
        }));
    };

    const removeLanguage = (index) => {
        if (profileData.languagesSpoken.length > 1) {
            const newLanguages = profileData.languagesSpoken.filter((_, i) => i !== index);
            setProfileData(prev => ({
                ...prev,
                languagesSpoken: newLanguages
            }));
        }
    };

    const handleSubjectToggle = (subjectId) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subjectId)) {
                return prev.filter(id => id !== subjectId);
            } else {
                return [...prev, subjectId];
            }
        });
    };

    const handleAvailabilityChange = (day, field, value) => {
        setProfileData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    [field]: value
                }
            }
        }));
    };

    const addTimeSlot = (day) => {
        const newSlot = { startTime: '09:00', endTime: '10:00' };
        setProfileData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    slots: [...prev.availability[day].slots, newSlot]
                }
            }
        }));
    };

    const updateTimeSlot = (day, slotIndex, field, value) => {
        setProfileData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    slots: prev.availability[day].slots.map((slot, index) =>
                        index === slotIndex ? { ...slot, [field]: value } : slot
                    )
                }
            }
        }));
    };

    const removeTimeSlot = (day, slotIndex) => {
        setProfileData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    slots: prev.availability[day].slots.filter((_, index) => index !== slotIndex)
                }
            }
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!profileData.yearsOfExperience || !profileData.hourlyRate || !profileData.preferredTeachingMethod) {
                    setError('Please fill in all required fields');
                    return false;
                }
                if (profileData.hourlyRate < 10 || profileData.hourlyRate > 200) {
                    setError('Hourly rate must be between $10 and $200');
                    return false;
                }
                break;
            case 2:
                if (selectedSubjects.length === 0) {
                    setError('Please select at least one subject you can teach');
                    return false;
                }
                break;
            case 3: {
                const hasAvailability = Object.values(profileData.availability)
                    .some(day => day.available && day.slots.length > 0);
                if (!hasAvailability) {
                    setError('Please set at least one availability slot');
                    return false;
                }
                break;
            }
            default:
                break;
        }
        setError('');
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        // Validate user authentication
        if (!user) {
            setError('User not authenticated. Please log in again.');
            return;
        }

        if (user.role !== 'tutor') {
            setError(`Access denied. User role is '${user.role}', but 'tutor' role is required.`);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token not found. Please log in again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🚀 Starting profile setup submission...');
            console.log('👤 Current user:', user);
            console.log('🔑 Token exists:', !!localStorage.getItem('token'));

            // Step 1: Update tutor profile
            console.log('📝 Step 1: Updating tutor profile...');
            const profileData_to_send = {
                yearsOfExperience: parseInt(profileData.yearsOfExperience),
                hourlyRate: parseFloat(profileData.hourlyRate),
                educationBackground: profileData.educationBackground,
                certifications: profileData.certifications ?
                    profileData.certifications.split(',').map(cert => cert.trim()).filter(cert => cert) : [],
                languagesSpoken: profileData.languagesSpoken.filter(lang => lang.trim()),
                teachingPhilosophy: profileData.teachingPhilosophy,
                preferredTeachingMethod: profileData.preferredTeachingMethod
            };
            console.log('📝 Profile data to send:', profileData_to_send);

            const profileResponse = await fetch('/api/profiles/tutor', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profileData_to_send)
            });

            if (!profileResponse.ok) {
                let errorText;
                try {
                    const errorData = await profileResponse.json();
                    errorText = errorData.message || `HTTP ${profileResponse.status}`;
                    console.error('❌ Profile update failed - JSON response:', errorData);
                } catch {
                    errorText = await profileResponse.text();
                    console.error('❌ Profile update failed - Text response:', errorText);
                }

                console.error('❌ Profile update failed:', {
                    status: profileResponse.status,
                    statusText: profileResponse.statusText,
                    headers: Object.fromEntries(profileResponse.headers.entries()),
                    error: errorText
                });
                throw new Error(`Failed to update profile: ${profileResponse.status} - ${errorText}`);
            }

            const profileResult = await profileResponse.json();
            console.log('✅ Profile update successful:', profileResult);

            // Step 2: Save subjects
            console.log('📚 Step 2: Saving subjects...');
            console.log('📚 Selected subjects:', selectedSubjects);

            if (selectedSubjects.length > 0) {
                const subjectsResponse = await fetch('/api/tutors/subjects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ subjects: selectedSubjects })
                });

                if (!subjectsResponse.ok) {
                    const errorText = await subjectsResponse.text();
                    console.error('❌ Subjects save failed:', {
                        status: subjectsResponse.status,
                        statusText: subjectsResponse.statusText,
                        error: errorText
                    });
                    throw new Error(`Failed to save subjects: ${subjectsResponse.status} - ${errorText}`);
                }

                const subjectsResult = await subjectsResponse.json();
                console.log('✅ Subjects save successful:', subjectsResult);
            } else {
                console.log('⚠️ No subjects selected, skipping subjects save');
            }

            // Step 3: Save availability
            console.log('📅 Step 3: Saving availability...');
            console.log('📅 Availability data:', profileData.availability);

            const availabilityResponse = await fetch('/api/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ availability: profileData.availability })
            });

            if (!availabilityResponse.ok) {
                const errorText = await availabilityResponse.text();
                console.error('❌ Availability save failed:', {
                    status: availabilityResponse.status,
                    statusText: availabilityResponse.statusText,
                    error: errorText
                });
                throw new Error(`Failed to save availability: ${availabilityResponse.status} - ${errorText}`);
            }

            const availabilityResult = await availabilityResponse.json();
            console.log('✅ Availability save successful:', availabilityResult);

            console.log('🎉 All steps completed successfully!');
            setSuccess('Profile setup completed successfully!');
            setTimeout(() => {
                navigate('/tutor');
            }, 2000);

        } catch (error) {
            console.error('❌ Profile setup error:', error);
            setError(`Failed to complete profile setup: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Basic Info', icon: User },
        { number: 2, title: 'Subjects', icon: BookOpen },
        { number: 3, title: 'Availability', icon: Calendar },
        { number: 4, title: 'Review', icon: CheckCircle }
    ];

    const renderBasicInfoStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-gray-600 mt-2">Tell us about your teaching experience and rates</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience *
                    </label>
                    <select
                        value={profileData.yearsOfExperience}
                        onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Select experience</option>
                        <option value="0">Less than 1 year</option>
                        <option value="1">1 year</option>
                        <option value="2">2 years</option>
                        <option value="3">3 years</option>
                        <option value="4">4 years</option>
                        <option value="5">5+ years</option>
                        <option value="10">10+ years</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (USD) *
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="number"
                            min="10"
                            max="200"
                            value={profileData.hourlyRate}
                            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="50"
                            required
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Background
                </label>
                <textarea
                    value={profileData.educationBackground}
                    onChange={(e) => handleInputChange('educationBackground', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="e.g., Bachelor's in Mathematics, Master's in Education..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                </label>
                <textarea
                    value={profileData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="List any teaching certifications or relevant qualifications..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                </label>
                {profileData.languagesSpoken.map((language, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={language}
                            onChange={(e) => handleLanguageChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Language"
                        />
                        {profileData.languagesSpoken.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeLanguage(index)}
                                className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addLanguage}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                >
                    + Add Language
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Teaching Method *
                </label>
                <select
                    value={profileData.preferredTeachingMethod}
                    onChange={(e) => handleInputChange('preferredTeachingMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                >
                    <option value="">Select teaching method</option>
                    <option value="online">Online Sessions</option>
                    <option value="in_person">In-Person Sessions</option>
                    <option value="both">Both Online and In-Person</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Philosophy
                </label>
                <textarea
                    value={profileData.teachingPhilosophy}
                    onChange={(e) => handleInputChange('teachingPhilosophy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe your approach to teaching and learning..."
                />
            </div>
        </div>
    );

    const renderSubjectsStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Subjects You Teach</h2>
                <p className="text-gray-600 mt-2">Select the subjects you're qualified to tutor</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.isArray(subjects) && subjects.length > 0 ? (
                    subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSubjects.includes(subject.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleSubjectToggle(subject.id)}
                        >
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject.id)}
                                    onChange={() => handleSubjectToggle(subject.id)}
                                    className="mr-3"
                                />
                                <div>
                                    <h3 className="font-medium text-gray-900">{subject.name}</h3>
                                    {subject.description && (
                                        <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8">
                        <div className="text-gray-500">
                            {subjects.length === 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                                        <span>Loading subjects...</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Fetching available subjects from the server
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p>No subjects available at the moment.</p>
                                    <p className="text-sm text-gray-400">
                                        There might be an issue connecting to the server
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={fetchSubjects}
                            className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Retry Loading Subjects
                        </button>
                    </div>
                )}
            </div>

            {selectedSubjects.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Selected Subjects:</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSubjects.map(subjectId => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return (
                                <span
                                    key={subjectId}
                                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                >
                                    {subject?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const renderAvailabilityStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Set Your Availability</h2>
                <p className="text-gray-600 mt-2">When are you available for tutoring sessions?</p>
            </div>

            <div className="space-y-4">
                {Object.entries(profileData.availability).map(([day, dayData]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={dayData.available}
                                    onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                                    className="mr-3"
                                />
                                <span className="font-medium capitalize">{day}</span>
                            </div>
                            {dayData.available && (
                                <button
                                    type="button"
                                    onClick={() => addTimeSlot(day)}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    + Add Time Slot
                                </button>
                            )}
                        </div>

                        {dayData.available && (
                            <div className="space-y-2">
                                {dayData.slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={slot.startTime}
                                            onChange={(e) => updateTimeSlot(day, index, 'startTime', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="time"
                                            value={slot.endTime}
                                            onChange={(e) => updateTimeSlot(day, index, 'endTime', e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeTimeSlot(day, index)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Review Your Profile</h2>
                <p className="text-gray-600 mt-2">Please review your information before submitting</p>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Experience:</span>
                            <span className="ml-2">{profileData.yearsOfExperience} years</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Hourly Rate:</span>
                            <span className="ml-2">${profileData.hourlyRate}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Languages:</span>
                            <span className="ml-2">{profileData.languagesSpoken.filter(l => l).join(', ')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedSubjects.length > 0 && Array.isArray(subjects) ? (
                            selectedSubjects.map(subjectId => {
                                const subject = subjects.find(s => s.id === subjectId);
                                return (
                                    <span
                                        key={subjectId}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {subject?.name || 'Unknown Subject'}
                                    </span>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-sm">No subjects selected</p>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                    <div className="space-y-2 text-sm">
                        {Object.entries(profileData.availability)
                            .filter(([_, dayData]) => dayData.available && dayData.slots.length > 0)
                            .map(([day, dayData]) => (
                                <div key={day}>
                                    <span className="font-medium capitalize">{day}:</span>
                                    <span className="ml-2">
                                        {dayData.slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.number;
                            const isCompleted = currentStep > step.number;

                            return (
                                <div key={step.number} className="flex-1">
                                    <div className="flex items-center">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isActive
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : isCompleted
                                                ? 'border-green-500 bg-green-500 text-white'
                                                : 'border-gray-300 bg-white text-gray-400'
                                            }`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3 hidden sm:block">
                                            <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                {step.title}
                                            </p>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className="flex-1 ml-4">
                                                <div className={`h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                                    }`} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-green-700">{success}</span>
                        </div>
                    )}

                    {currentStep === 1 && renderBasicInfoStep()}
                    {currentStep === 2 && renderSubjectsStep()}
                    {currentStep === 3 && renderAvailabilityStep()}
                    {currentStep === 4 && renderReviewStep()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`px-6 py-2 rounded-lg border transition-colors ${currentStep === 1
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Complete Setup
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorProfileSetup;