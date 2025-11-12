import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TutorProfileChecker = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);

    useEffect(() => {
        const checkTutorProfile = async () => {
            if (!user || user.role !== 'tutor') {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/profiles/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const tutorProfile = data.tutorProfile;

                    // Check if essential profile fields are completed
                    const isComplete = tutorProfile &&
                        tutorProfile.experienceYears > 0 &&
                        tutorProfile.hourlyRate > 0 &&
                        tutorProfile.subjects &&
                        tutorProfile.subjects.length > 0;

                    setProfileComplete(isComplete);

                    // If profile is not complete, redirect to setup
                    if (!isComplete) {
                        navigate('/tutor-setup');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error checking tutor profile:', error);
                // On error, allow access but log the issue
            }

            setLoading(false);
        };

        checkTutorProfile();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return children;
};

export default TutorProfileChecker;