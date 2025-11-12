import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileChecker = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);

    useEffect(() => {
        const checkUserProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            // Skip profile check if user is already on setup pages
            const setupPaths = ['/tutor-setup', '/student-setup', '/profile-setup'];
            if (setupPaths.some(path => location.pathname.startsWith(path))) {
                setLoading(false);
                setProfileComplete(true);
                return;
            }

            try {
                // Check profile completion based on user role
                if (user.role === 'tutor') {
                    await checkTutorProfile();
                } else if (user.role === 'student') {
                    await checkStudentProfile();
                } else {
                    // Admin users don't need profile setup
                    setProfileComplete(true);
                }
            } catch (error) {
                console.error('Error checking user profile:', error);
                // On error, allow access but log the issue
                setProfileComplete(true);
            }

            setLoading(false);
        };

        const checkTutorProfile = async () => {
            try {
                console.log('Checking tutor profile for user:', user.id);
                const response = await fetch(`/api/profiles/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const tutorProfile = data.tutorProfile;

                    console.log('Tutor profile data:', tutorProfile);

                    // Check if essential tutor profile fields are completed
                    const isComplete = tutorProfile &&
                        tutorProfile.experienceYears !== null &&
                        tutorProfile.hourlyRate > 0 &&
                        tutorProfile.education &&
                        tutorProfile.subjects &&
                        tutorProfile.subjects.length > 0;

                    console.log('Tutor profile complete:', isComplete);
                    setProfileComplete(isComplete);

                    // If profile is not complete, redirect to setup
                    if (!isComplete) {
                        console.log('Redirecting to tutor setup...');
                        navigate('/tutor-setup', { replace: true });
                        return;
                    }
                } else if (response.status === 404) {
                    // No profile exists, redirect to setup
                    console.log('No tutor profile found, redirecting to setup...');
                    setProfileComplete(false);
                    navigate('/tutor-setup', { replace: true });
                    return;
                } else {
                    console.error('Error fetching tutor profile:', response.status);
                    // Allow access on error
                    setProfileComplete(true);
                }
            } catch (error) {
                console.error('Error checking tutor profile:', error);
                setProfileComplete(true);
            }
        };

        const checkStudentProfile = async () => {
            try {
                console.log('Checking student profile for user:', user.id);
                const response = await fetch(`/api/profiles/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const studentProfile = data.studentProfile || data.user;

                    console.log('Student profile data:', studentProfile);

                    // Check if essential student profile fields are completed
                    // For students, we mainly need basic info which might already be set during registration
                    const isComplete = studentProfile &&
                        studentProfile.firstName &&
                        studentProfile.lastName &&
                        studentProfile.grade !== null;

                    console.log('Student profile complete:', isComplete);
                    setProfileComplete(isComplete);

                    // If profile is not complete, redirect to student setup
                    if (!isComplete) {
                        console.log('Redirecting to student setup...');
                        navigate('/student-setup', { replace: true });
                        return;
                    }
                } else if (response.status === 404) {
                    // No profile exists, redirect to setup
                    console.log('No student profile found, redirecting to setup...');
                    setProfileComplete(false);
                    navigate('/student-setup', { replace: true });
                    return;
                } else {
                    console.error('Error fetching student profile:', response.status);
                    // Allow access on error
                    setProfileComplete(true);
                }
            } catch (error) {
                console.error('Error checking student profile:', error);
                setProfileComplete(true);
            }
        };

        checkUserProfile();
    }, [user, navigate, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking profile...</p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProfileChecker;