import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profiles } from '../services';

const StudentProfileSetup = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        grade: '',
        school: '',
        interests: '',
        bio: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Pre-fill form with existing user data
        if (user) {
            setFormData({
                firstName: user.firstName || user.first_name || '',
                lastName: user.lastName || user.last_name || '',
                grade: user.grade || '',
                school: user.school || '',
                interests: user.interests || '',
                bio: user.bio || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Save base user info
            await profiles.updateUser(user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio
            });

            // Save student-specific info aligned with backend schema
            const payload = {};
            if (formData.grade) payload.gradeLevel = String(formData.grade);
            if (formData.school) payload.schoolName = formData.school;
            if (formData.interests) {
                payload.learningGoals = formData.interests;
                const arr = formData.interests.split(',').map(s => s.trim()).filter(Boolean);
                if (arr.length) payload.subjectsOfInterest = arr;
            }
            // Only include preferredLearningStyle if user explicitly selects one (avoid empty string)
            if (formData.preferredLearningStyle) payload.preferredLearningStyle = formData.preferredLearningStyle;

            await profiles.updateStudent(user.id, payload);

            // Update auth context display fields
            await updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio
            });

            // Redirect to student dashboard
            navigate('/student', { replace: true });
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Student Profile</h1>
                    <p className="text-gray-600">Please fill in your information to get started</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                                Grade Level *
                            </label>
                            <select
                                id="grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Grade</option>
                                <option value="6">6th Grade</option>
                                <option value="7">7th Grade</option>
                                <option value="8">8th Grade</option>
                                <option value="9">9th Grade</option>
                                <option value="10">10th Grade</option>
                                <option value="11">11th Grade</option>
                                <option value="12">12th Grade</option>
                                <option value="13">College Freshman</option>
                                <option value="14">College Sophomore</option>
                                <option value="15">College Junior</option>
                                <option value="16">College Senior</option>
                                <option value="17">Graduate Student</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                                School/Institution
                            </label>
                            <input
                                type="text"
                                id="school"
                                name="school"
                                value={formData.school}
                                onChange={handleChange}
                                placeholder="e.g., Washington High School"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Interests
                        </label>
                        <input
                            type="text"
                            id="interests"
                            name="interests"
                            value={formData.interests}
                            onChange={handleChange}
                            placeholder="e.g., Mathematics, Science, Literature"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                            About You
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell us a bit about yourself, your learning goals, or what you hope to achieve..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-between pt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/student')}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Skip for Now
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Complete Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentProfileSetup;