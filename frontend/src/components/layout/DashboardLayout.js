import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home,
    Search,
    MessageSquare,
    CheckSquare,
    Users,
    BookOpen,
    BarChart,
    Menu,
    X,
    Clock,
    Star,
    Calendar
} from 'lucide-react';
import Toaster from '../ui/Toaster';

const DashboardLayout = ({ userRole, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    // Define navigation items based on user role
    const getNavigationItems = () => {
        // Base common items for students and tutors
        const baseCommonItems = [
            { name: 'Dashboard', href: `/${userRole}`, icon: Home },
            { name: 'Messages', href: `/${userRole}/messages`, icon: MessageSquare },
            { name: 'Tasks', href: `/${userRole}/tasks`, icon: CheckSquare },
            { name: 'Calendar', href: `/${userRole}/calendar`, icon: Calendar }
        ];

        // Admin gets basic navigation without calendar, tasks or platform messages
        const adminCommonItems = [
            { name: 'Dashboard', href: `/${userRole}`, icon: Home }
        ];

        const commonItems = userRole === 'admin' ? adminCommonItems : baseCommonItems;

        const roleSpecificItems = {
            student: [
                { name: 'Find Tutors', href: '/student/tutors', icon: Search },
                { name: 'My Sessions', href: '/student/sessions', icon: BookOpen }
            ],
            tutor: [
                { name: 'My Sessions', href: '/tutor/sessions', icon: BookOpen },
                { name: 'Analytics', href: '/tutor/analytics', icon: BarChart },
                { name: 'Availability', href: '/tutor/availability', icon: Clock }
            ],
            admin: [
                { name: 'Users', href: '/admin/users', icon: Users },
                { name: 'Sessions', href: '/admin/sessions', icon: BookOpen },
                { name: 'Reviews', href: '/admin/reviews', icon: Star }
            ]
        };

        // Settings only for students and tutors, not admin
        const settingsItem = userRole !== 'admin'
            ? { name: 'Settings', href: `/${userRole}/settings`, icon: Users }
            : null;

        return [
            ...commonItems,
            ...roleSpecificItems[userRole],
            ...(settingsItem ? [settingsItem] : [])
        ];
    };

    const navigation = getNavigationItems();

    const isCurrentPath = (href) => {
        if (href === `/${userRole}`) {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 lg:block transition-transform duration-300 ease-in-out flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-6 bg-primary-600 text-white flex-shrink-0">
                    <Link to="/" className="font-bold text-lg">
                        TutorConnect
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* User Profile Section */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {user?.profileImageUrl ? (
                                <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={user?.profileImageUrl}
                                    alt={user?.firstName}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                style={{ display: user?.profileImageUrl ? 'none' : 'flex' }}
                            >
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-6 px-3 overflow-y-auto">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const current = isCurrentPath(item.href);

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`${current
                                        ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        } group flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-colors`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon
                                        className={`${current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                                            } mr-3 h-5 w-5 transition-colors`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom section */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex items-center space-x-4">
                            {/* Notifications could go here */}
                            <div className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
                {/* Global Toasts */}
                <Toaster />
            </div>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;