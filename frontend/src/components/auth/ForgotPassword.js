import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import { authService } from '../../services';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authService.requestPasswordReset(email);
            setMessage(response.message || 'If an account with that email exists, we have sent a password reset link.');
            setIsSuccess(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AuthNavbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Forgot your password?
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {isSuccess ? (
                                "Check your email for a reset link"
                            ) : (
                                "Enter your email address and we'll send you a link to reset your password"
                            )}
                        </p>
                    </div>

                    {!isSuccess ? (
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter your email address"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Sending reset link...
                                        </div>
                                    ) : (
                                        'Send reset link'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-8 space-y-6">
                            {message && (
                                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative text-center">
                                    <span className="block sm:inline">{message}</span>
                                </div>
                            )}

                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    Didn't receive an email? Check your spam folder or try again.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setEmail('');
                                        setMessage('');
                                    }}
                                    className="text-blue-600 hover:text-blue-500 font-medium"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;