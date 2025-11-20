import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Tracks initial auth check only; avoids unmounting routes during actions like login
    const [initializing, setInitializing] = useState(true);
    // Optional UI-level loading for actions (login/signup) if components want it
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check for existing auth on app load
    useEffect(() => {
        checkAuth();
        // We intentionally run this once on mount to verify existing auth
        // and initialize user state.
        // eslint-disable-next-line
    }, []);

    const checkAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }

                // Verify token with backend and get complete user data
                try {
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (error) {
                    // Token might be expired, clear auth
                    logout();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setInitializing(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.login(email, password);
            const userData = response.user;

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            const errorMessage = error.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.register(userData);
            const newUser = response.user;

            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);

            return { success: true, user: newUser };
        } catch (error) {
            const errorMessage = error.message || 'Registration failed';
            setError(errorMessage);

            // Pass along detailed validation errors from backend
            return {
                success: false,
                error: errorMessage,
                errors: error.errors, // Include validation errors array
                statusCode: error.statusCode
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateProfile = async (updatedData) => {
        try {
            setError(null);
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Profile update failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        initializing,
        error,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student',
        isTutor: user?.role === 'tutor',
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };