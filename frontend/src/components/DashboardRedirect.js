import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
    const { user } = useAuth();

    // Redirect to the appropriate role-based dashboard
    const dashboardPath = user?.role === 'admin' ? '/admin' :
        user?.role === 'tutor' ? '/tutor' : '/student';

    return <Navigate to={dashboardPath} replace />;
};

export default DashboardRedirect;