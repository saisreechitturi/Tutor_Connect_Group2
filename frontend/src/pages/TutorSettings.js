import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import userService from '../services/userService';

const TutorSettings = () => {
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
        // Tutor-specific fields
        hourlyRate: '',
        qualifications: '',
        experience: '',
        availability: {},
        subjectsTeaching: [],
        teachingMethods: [],
        certifications: '',
        yearsOfExperience: 0,
        maxStudents: 10,
        preferredAge: 'all',
        languages: []
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
                // Tutor-specific fields
                hourlyRate: userData.profile?.hourlyRate || '',
                qualifications: userData.profile?.educationBackground || '', // Map to correct field
                experience: userData.profile?.teachingPhilosophy || '', // Map to correct field
                availability: userData.profile?.availability || {},
                subjectsTeaching: Array.isArray(userData.profile?.subjectsTeaching) ? userData.profile.subjectsTeaching : [],
                teachingMethods: userData.profile?.preferredTeachingMethod ? [userData.profile.preferredTeachingMethod] : [],
                certifications: userData.profile?.certifications || '',
                yearsOfExperience: userData.profile?.yearsOfExperience || 0,
                maxStudents: userData.profile?.maxStudents || 10,
                preferredAge: userData.profile?.preferredAge || 'all',
                languages: Array.isArray(userData.profile?.languagesSpoken) ? userData.profile.languagesSpoken : []
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
            // Prepare data for API - convert arrays from strings if needed and map to backend fields
            const dataToSend = {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phone: profileData.phone,
                dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : null,
                address: profileData.address,
                pincode: profileData.pincode,
                bio: profileData.bio,
                profilePictureUrl: profileData.profilePictureUrl,
                // Tutor-specific fields mapped to backend schema
                hourlyRate: parseFloat(profileData.hourlyRate) || 0,
                yearsOfExperience: parseInt(profileData.yearsOfExperience) || 0,
                educationBackground: profileData.qualifications, // Map qualifications to educationBackground
                certifications: profileData.certifications,
                teachingPhilosophy: profileData.experience, // Map experience to teachingPhilosophy
                languagesSpoken: Array.isArray(profileData.languages)
                    ? profileData.languages
                    : profileData.languages.split(',').map(s => s.trim()).filter(s => s),
                preferredTeachingMethod: Array.isArray(profileData.teachingMethods)
                    ? profileData.teachingMethods[0] || ''
                    : profileData.teachingMethods.split(',')[0]?.trim() || '',
                isAvailableNow: true // default to available
            };

            await userService.updateProfile(user.id, dataToSend);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Failed to save profile settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Load user data when component mounts
    useEffect(() => {
        if (user?.id) {
            fetchUserData();
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(12)].map((_, i) => (
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
                    <h1 className="text-2xl font-bold text-gray-900">Tutor Profile Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your tutor profile information</p>
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
                                            {profileData.firstName?.[0] || profileData.email?.[0] || 'T'}
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
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
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
                        </div>

                        {/* Professional Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={profileData.hourlyRate}
                                        onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                                        placeholder="Enter your hourly rate"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={profileData.yearsOfExperience}
                                        onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                                        placeholder="Years of teaching experience"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Students</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={profileData.maxStudents}
                                        onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                                        placeholder="Max number of students"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Age Group</label>
                                    <select
                                        value={profileData.preferredAge}
                                        onChange={(e) => handleInputChange('preferredAge', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Ages</option>
                                        <option value="elementary">Elementary (5-10)</option>
                                        <option value="middle">Middle School (11-13)</option>
                                        <option value="high">High School (14-18)</option>
                                        <option value="college">College (18+)</option>
                                        <option value="adult">Adult Learners</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                                <textarea
                                    value={profileData.qualifications}
                                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                                    rows={3}
                                    placeholder="List your educational qualifications and degrees"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                                <textarea
                                    value={profileData.experience}
                                    onChange={(e) => handleInputChange('experience', e.target.value)}
                                    rows={4}
                                    placeholder="Describe your teaching or professional experience"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                                <textarea
                                    value={profileData.certifications}
                                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                                    rows={3}
                                    placeholder="List any relevant certifications"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subjects Teaching</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(profileData.subjectsTeaching)
                                            ? profileData.subjectsTeaching.join(', ')
                                            : profileData.subjectsTeaching}
                                        onChange={(e) => handleInputChange('subjectsTeaching', e.target.value)}
                                        placeholder="e.g., Mathematics, Physics, Computer Science"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separate multiple subjects with commas</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Methods</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(profileData.teachingMethods)
                                            ? profileData.teachingMethods.join(', ')
                                            : profileData.teachingMethods}
                                        onChange={(e) => handleInputChange('teachingMethods', e.target.value)}
                                        placeholder="e.g., Visual aids, Hands-on practice, Discussion"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separate multiple methods with commas</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                                <input
                                    type="text"
                                    value={Array.isArray(profileData.languages)
                                        ? profileData.languages.join(', ')
                                        : profileData.languages}
                                    onChange={(e) => handleInputChange('languages', e.target.value)}
                                    placeholder="e.g., English, Spanish, French"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Separate multiple languages with commas</p>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    rows={4}
                                    placeholder="Tell students about yourself, your teaching philosophy, and what makes you a great tutor..."
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

export default TutorSettings;