import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, Key } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import { authService } from '../../services';
import Alert from '../ui/Alert';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [manualToken, setManualToken] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Prefill email if provided via navigation state (e.g., after 5 failed logins)
    useEffect(() => {
        const prefill = location.state?.email;
        if (prefill) {
            setEmail(prefill);
        }
    }, [location.state]);

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

                            <div className="text-center space-y-4">
                                <p className="text-sm text-gray-600">
                                    Didn't receive an email? Check your spam folder or try again.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

                                    <span className="text-gray-400 hidden sm:inline">|</span>

                                    <button
                                        onClick={() => setShowTokenInput(!showTokenInput)}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
                                    >
                                        <Key className="h-4 w-4 mr-1" />
                                        {showTokenInput ? 'Hide' : 'Enter token manually'}
                                    </button>
                                </div>

                                {showTokenInput && (
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-left">
                                            <label htmlFor="manualToken" className="block text-sm font-medium text-gray-700 mb-2">
                                                Reset Token
                                            </label>
                                            <input
                                                id="manualToken"
                                                name="manualToken"
                                                type="text"
                                                value={manualToken}
                                                onChange={(e) => {
                                                    setManualToken(e.target.value);
                                                    setError(''); // Clear error when typing
                                                }}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none text-sm font-mono ${manualToken && manualToken.length !== 64
                                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                    : manualToken && manualToken.length === 64
                                                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                placeholder="Paste your 64-character reset token here..."
                                            />
                                            <div className="mt-1 text-xs">
                                                {manualToken && (
                                                    <span className={`${manualToken.length === 64 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {manualToken.length}/64 characters
                                                        {manualToken.length === 64 && ' ✓'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                If you have the reset token from server logs or email, paste it above. Token should be exactly 64 characters long.
                                            </p>
                                            {process.env.NODE_ENV === 'development' && (
                                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                    <strong>Development Mode:</strong> Check browser console or server logs for the reset token URL after requesting password reset.
                                                </div>
                                            )}
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (manualToken.trim() && manualToken.length === 64) {
                                                            navigate(`/reset-password/${manualToken.trim()}`);
                                                        } else {
                                                            setError('Please enter a valid 64-character reset token.');
                                                        }
                                                    }}
                                                    disabled={!manualToken.trim()}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Go to Reset Password
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowTokenInput(false);
                                                        setManualToken('');
                                                        setError('');
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-center space-y-2">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to login
                        </Link>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-500">
                                <span>Development: </span>
                                <Link
                                    to="/reset-password/test-token-placeholder"
                                    className="text-blue-600 hover:text-blue-500 underline"
                                >
                                    Go to Reset Password Page
                                </Link>
                                <span> (replace 'test-token-placeholder' in URL with actual token)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;