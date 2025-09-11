import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* 404 Illustration */}
                <div>
                    <h1 className="text-9xl font-bold text-primary-600">404</h1>
                    <div className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</div>
                </div>

                {/* Error Message */}
                <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                    <p className="text-gray-500">
                        It might have been moved, deleted, or you entered the wrong URL.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="btn-primary inline-flex items-center justify-center"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="btn-secondary inline-flex items-center justify-center"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Search Suggestion */}
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-3">Or try searching for what you need:</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search tutors, subjects, or resources..."
                                className="input-field pl-10"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        // In a real app, this would perform a search
                                        alert(`Searching for: ${e.target.value}`);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Help Links */}
                <div className="pt-8">
                    <p className="text-sm text-gray-500 mb-4">Need help? Try these popular pages:</p>
                    <div className="space-y-2">
                        <Link to="/login" className="block text-primary-600 hover:text-primary-700 text-sm">
                            Sign In to Your Account
                        </Link>
                        <Link to="/signup" className="block text-primary-600 hover:text-primary-700 text-sm">
                            Create New Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;