import React, { createContext, useContext, useState, useEffect } from 'react';
import { users } from '../data';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored auth state
        const storedUser = localStorage.getItem('tutorConnect_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Mock authentication - find user by email and password
            const foundUser = users.find(
                u => u.email === email && u.password === password
            );

            if (!foundUser) {
                throw new Error('Invalid email or password');
            }

            // Remove password from user object for security
            const { password: _, ...userWithoutPassword } = foundUser;

            setUser(userWithoutPassword);
            localStorage.setItem('tutorConnect_user', JSON.stringify(userWithoutPassword));

            return { success: true, user: userWithoutPassword };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (userData) => {
        try {
            // Check if email already exists
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
                throw new Error('Email already registered');
            }

            // Create new user (in a real app, this would be an API call)
            const newUser = {
                id: users.length + 1,
                email: userData.email,
                username: userData.username,
                role: userData.role || 'student',
                profile: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone || '',
                    avatar: `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150`,
                    bio: '',
                    location: '',
                    joinedDate: new Date().toISOString().split('T')[0]
                }
            };

            // Add to users array (mock database)
            users.push({ ...newUser, password: userData.password });

            // Remove password for client-side storage
            const { password: _, ...userWithoutPassword } = newUser;

            setUser(userWithoutPassword);
            localStorage.setItem('tutorConnect_user', JSON.stringify(userWithoutPassword));

            return { success: true, user: userWithoutPassword };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('tutorConnect_user');
    };

    const updateProfile = async (updates) => {
        try {
            const updatedUser = {
                ...user,
                profile: {
                    ...user.profile,
                    ...updates
                }
            };

            setUser(updatedUser);
            localStorage.setItem('tutorConnect_user', JSON.stringify(updatedUser));

            return { success: true, user: updatedUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        login,
        signup,
        logout,
        updateProfile,
        loading,
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