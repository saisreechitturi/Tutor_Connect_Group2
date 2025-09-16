import React from 'react';
import { Link } from 'react-router-dom';

const AuthNavbar = () => {
    return (
        <nav className="bg-primary-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="font-bold text-xl hover:text-primary-100 transition-colors">
                        TutorConnect
                    </Link>

                    {/* Right side - Auth links */}
                    <div className="flex items-center space-x-6">
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
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default AuthNavbar;