import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
    const { isAuthenticated, user, initializing } = useAuth();
    const location = useLocation();

    // Only block rendering while the app is performing the initial auth check.
    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (requireAuth && !isAuthenticated) {
        // Redirect to login with return path
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!requireAuth && isAuthenticated) {
        // If user is already logged in, redirect to appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/admin' :
            user?.role === 'tutor' ? '/tutor' : '/student';
        return <Navigate to={dashboardPath} replace />;
    }

    if (allowedRoles.length > 0 && isAuthenticated && !allowedRoles.includes(user?.role)) {
        // User doesn't have required role, redirect to their appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/admin' :
            user?.role === 'tutor' ? '/tutor' : '/student';
        return <Navigate to={dashboardPath} replace />;
    }

    return children;
};

export default ProtectedRoute;