import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Direct redirect to dashboard based on user role
    const dashboardPath = user?.role === 'admin' ? '/admin' :
        user?.role === 'tutor' ? '/tutor' : '/student';

    return <Navigate to={dashboardPath} replace />;
};

export default DashboardRedirect;