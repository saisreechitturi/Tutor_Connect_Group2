import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
    const { isAuthenticated, user, initializing } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute check:', {
        isAuthenticated,
        userRole: user?.role,
        allowedRoles,
        requireAuth,
        location: location.pathname
    });

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
        console.log('Redirecting to login - not authenticated');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!requireAuth && isAuthenticated) {
        // If user is already logged in, redirect to appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/admin' :
            user?.role === 'tutor' ? '/tutor' : '/student';
        console.log('Redirecting to dashboard - already authenticated:', dashboardPath);
        return <Navigate to={dashboardPath} replace />;
    }

    if (allowedRoles.length > 0 && isAuthenticated && !allowedRoles.includes(user?.role)) {
        // User doesn't have required role, redirect to their appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/admin' :
            user?.role === 'tutor' ? '/tutor' : '/student';
        console.log('Role mismatch - redirecting to:', dashboardPath);
        return <Navigate to={dashboardPath} replace />;
    }

    console.log('ProtectedRoute - rendering children');
    return children;
};

export default ProtectedRoute;