import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

const ServerError = () => {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="bg-red-100 rounded-full p-6">
                        <AlertCircle className="h-16 w-16 text-red-600" />
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
                    <p className="text-lg text-gray-600">
                        We're experiencing some technical difficulties.
                    </p>
                    <p className="text-gray-500">
                        Please try refreshing the page or come back later.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleRefresh}
                            className="btn-primary inline-flex items-center justify-center"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                        <Link
                            to="/"
                            className="btn-secondary inline-flex items-center justify-center"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go Home
                        </Link>
                    </div>
                </div>

                {/* Error Details (for development) */}
                <div className="pt-8 text-left">
                    <details className="bg-gray-100 rounded-lg p-4">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Error Details (Development)
                        </summary>
                        <div className="mt-3 text-sm text-gray-600">
                            <p><strong>Error Code:</strong> 500</p>
                            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                            <p className="mt-2">
                                <strong>Description:</strong> Internal server error occurred while processing your request.
                            </p>
                        </div>
                    </details>
                </div>

                {/* Contact Support */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                        If this problem persists, please contact our support team.
                    </p>
                    <button
                        onClick={() => alert('Support contact feature would be implemented here')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServerError;