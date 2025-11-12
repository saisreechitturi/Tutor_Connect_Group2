import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileChecker from './ProfileChecker';

const DashboardRedirect = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Wrap the dashboard redirect with ProfileChecker to ensure profile is complete
    const dashboardPath = user?.role === 'admin' ? '/admin' :
        user?.role === 'tutor' ? '/tutor' : '/student';

    return (
        <ProfileChecker>
            <Navigate to={dashboardPath} replace />
        </ProfileChecker>
    );
};

export default DashboardRedirect;