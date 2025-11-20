import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import { authService } from '../../services';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import Alert from '../ui/Alert';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenError, setTokenError] = useState('');

    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Validate token format
        if (!token || token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
            setTokenError('Invalid or malformed reset token');
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const validateForm = () => {
        const { password, confirmPassword } = formData;

        if (!password) {
            setError('New password is required');
            return false;
        }

        if (!confirmPassword) {
            setError('Please confirm your new password');
            return false;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Check if password is strong enough
        if (password.length < 12 && !/(?=.*[!@#$%^&*])/.test(password)) {
            // This is just a warning, not blocking
            console.warn('Consider using a longer password or including special characters for better security');
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            await authService.resetPassword(token, formData.password);
            setIsSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Password reset successful. Please log in with your new password.' }
                });
            }, 3000);
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';

            if (message.includes('Invalid or expired')) {
                setTokenError('This password reset link has expired or is invalid. Please request a new password reset.');
            } else if (message.includes('Validation failed')) {
                setError('Please check that your password meets all requirements and try again.');
            } else if (message.includes('Failed to reset password')) {
                setError('We encountered an issue resetting your password. Please try again or request a new reset link.');
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Show token error screen
    if (tokenError) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AuthNavbar />
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div>
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <Lock className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Invalid Reset Link
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                {tokenError}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                to="/forgot-password"
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Request new reset link
                            </Link>

                            <Link
                                to="/login"
                                className="text-blue-600 hover:text-blue-500"
                            >
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show success screen
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AuthNavbar />
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div>
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Password Reset Successful!
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                            </p>
                        </div>

                        <div>
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Go to login now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show reset form
    return (
        <div className="min-h-screen bg-gray-50">
            <AuthNavbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Reset your password
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your new password below
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter new password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={formData.password} />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm New Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Confirm new password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
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
                                        Resetting password...
                                    </div>
                                ) : (
                                    'Reset password'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center space-y-2">
                        <div>
                            <Link
                                to="/login"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Back to login
                            </Link>
                        </div>
                        <div>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-gray-600 hover:text-gray-500"
                            >
                                Need a new reset link?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;