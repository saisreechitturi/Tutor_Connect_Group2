import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import { authService } from '../../services';
import Alert from '../ui/Alert';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Email address is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authService.requestPasswordReset(email);
            setMessage(response.message || 'If an account with that email exists, we have sent a password reset link to your inbox. Please check your email and follow the instructions to reset your password.');
            setIsSuccess(true);
        } catch (error) {
            let errorMessage = error.response?.data?.message || error.message;

            // Provide more user-friendly error messages
            if (errorMessage.includes('Validation failed')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (errorMessage.includes('Failed to process')) {
                errorMessage = 'We encountered an issue processing your request. Please try again in a few minutes.';
            } else if (!errorMessage) {
                errorMessage = 'Failed to send password reset email. Please try again.';
            }

            setError(errorMessage);
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
                                <Alert
                                    type="error"
                                    message={error}
                                    onClose={() => setError('')}
                                />
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
                                <Alert
                                    type="success"
                                    message={message}
                                />
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