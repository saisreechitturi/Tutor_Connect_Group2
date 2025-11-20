import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import userService from '../services/userService';

const StudentSettings = () => {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        pincode: '',
        bio: '',
        profilePictureUrl: '',
        // Student-specific fields
        gradeLevel: '',
        schoolName: '',
        learningGoals: '',
        preferredLearningStyle: 'visual',
        subjectsOfInterest: [],
        availabilitySchedule: {},
        emergencyContact: {}
    });

    // Fetch fresh user data from the API
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getProfile(user.id);
            const userData = response.user;

            setProfileData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                dateOfBirth: userData.dateOfBirth || '',
                address: userData.address || '',
                pincode: userData.pincode || '',
                bio: userData.bio || '',
                profilePictureUrl: userData.profilePictureUrl || '',
                // Student-specific fields
                gradeLevel: userData.profile?.gradeLevel || '',
                schoolName: userData.profile?.schoolName || '',
                learningGoals: userData.profile?.learningGoals || '',
                preferredLearningStyle: userData.profile?.preferredLearningStyle || 'visual',
                subjectsOfInterest: Array.isArray(userData.profile?.subjectsOfInterest) ? userData.profile.subjectsOfInterest : [],
                availabilitySchedule: userData.profile?.availabilitySchedule || {},
                emergencyContact: userData.profile?.emergencyContact || {}
            });
        } catch (err) {
            console.error('Error fetching user data:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('handleSave - Starting save process');
            console.log('handleSave - user.id:', user.id);
            console.log('handleSave - profileData:', profileData);

            // Prepare data for API - convert subjects string to array if needed
            const dataToSend = {
                ...profileData,
                subjectsOfInterest: Array.isArray(profileData.subjectsOfInterest)
                    ? profileData.subjectsOfInterest
                    : profileData.subjectsOfInterest.split(',').map(s => s.trim()).filter(s => s),
                // Ensure date is in correct format
                dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : null,
                // Only include profile picture URL if it's a valid URL or empty
                profilePictureUrl: profileData.profilePictureUrl && profileData.profilePictureUrl.trim() !== ''
                    ? profileData.profilePictureUrl
                    : null
            };

            console.log('handleSave - dataToSend:', dataToSend);

            const result = await userService.updateProfile(user.id, dataToSend);
            console.log('handleSave - API result:', result);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile settings. Please try again.';
            setError(`Failed to save: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    // Load user data when component mounts
    useEffect(() => {
        console.log('StudentSettings - user object:', user);
        if (user?.id) {
            console.log('StudentSettings - fetching data for user ID:', user.id);
            fetchUserData();
        } else {
            console.log('StudentSettings - no user ID available');
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={fetchUserData}
                        className="ml-auto text-red-700 underline hover:text-red-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-green-800">Profile updated successfully!</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Student Profile Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your student profile information</p>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>

                            {/* Avatar Section */}
                            <div className="flex items-center space-x-6 mb-6">
                                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profileData.profilePictureUrl ? (
                                        <img
                                            src={profileData.profilePictureUrl}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-blue-500 flex items-center justify-center text-white text-2xl font-medium">
                                            {profileData.firstName?.[0] || profileData.email?.[0] || 'S'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={profileData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode/ZIP Code</label>
                                    <input
                                        type="text"
                                        value={profileData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        placeholder="Enter your pincode or ZIP code"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    value={profileData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    rows={3}
                                    placeholder="Enter your full address"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    maxLength={500}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                                    <input
                                        type="text"
                                        value={profileData.gradeLevel}
                                        onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                                        placeholder="e.g., 10th Grade, College Freshman"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                                    <input
                                        type="text"
                                        value={profileData.schoolName}
                                        onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                        placeholder="Your school or university"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Goals</label>
                                <textarea
                                    value={profileData.learningGoals}
                                    onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                                    rows={3}
                                    placeholder="What do you hope to achieve through tutoring?"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning Style</label>
                                    <select
                                        value={profileData.preferredLearningStyle}
                                        onChange={(e) => handleInputChange('preferredLearningStyle', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="visual">Visual</option>
                                        <option value="auditory">Auditory</option>
                                        <option value="kinesthetic">Kinesthetic</option>
                                        <option value="reading">Reading/Writing</option>
                                        <option value="both">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subjects of Interest</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(profileData.subjectsOfInterest)
                                            ? profileData.subjectsOfInterest.join(', ')
                                            : profileData.subjectsOfInterest}
                                        onChange={(e) => handleInputChange('subjectsOfInterest', e.target.value)}
                                        placeholder="e.g., Mathematics, Physics, Computer Science"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separate multiple subjects with commas</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    rows={4}
                                    placeholder="Tell tutors a bit about yourself, your learning style, and what you're looking for..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;