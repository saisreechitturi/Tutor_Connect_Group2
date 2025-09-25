import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate('/');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        return user.role === 'admin' ? '/admin' :
            user.role === 'tutor' ? '/tutor' : '/student';
    };

    return (
        <nav className="bg-primary-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="font-bold text-xl hover:text-primary-100 transition-colors">
                        TutorConnect
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={getDashboardLink()}
                                    className="hover:text-primary-100 transition-colors"
                                >
                                    Dashboard
                                </Link>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 hover:text-primary-100 transition-colors focus:outline-none"
                                    >
                                        <img
                                            src={user?.profile?.avatar}
                                            alt={user?.profile?.firstName}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span>{user?.profile?.firstName}</span>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <Link
                                                to={`${getDashboardLink()}/profile`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <User className="w-4 h-4 mr-2" />
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/about" className="hover:text-primary-100 transition-colors">
                                    About Us
                                </Link>
                                <Link to="/browse-tutors" className="hover:text-primary-100 transition-colors">
                                    Browse Tutors
                                </Link>
                                <Link to="/login" className="hover:text-primary-100 transition-colors">
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-white text-primary-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white hover:text-primary-100 focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to={getDashboardLink()}
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to={`${getDashboardLink()}/profile`}
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/about"
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        About Us
                                    </Link>
                                    <Link
                                        to="/browse-tutors"
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Browse Tutors
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block px-3 py-2 text-base font-medium hover:text-primary-100 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
