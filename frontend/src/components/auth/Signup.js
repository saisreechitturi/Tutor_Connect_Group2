import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import Alert from '../ui/Alert';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        phone: '',
        dateOfBirth: '',
        address: '',
        pincode: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        // Check required fields
        if (!formData.firstName.trim()) {
            setError('First name is required');
            return false;
        }
        if (!formData.lastName.trim()) {
            setError('Last name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email address is required');
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        // Validate password
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
            return false;
        }

        // Validate password confirmation
        if (!formData.confirmPassword) {
            setError('Please confirm your password');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Validate phone number if provided
        if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            setError('Please enter a valid phone number');
            return false;
        }

        // Validate date of birth if provided
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            if (birthDate >= today) {
                setError('Date of birth must be in the past');
                return false;
            }
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                setError('You must be at least 13 years old to register');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        const result = await signup(formData);

        if (result.success) {
            // Redirect based on user role
            if (result.user && result.user.role === 'tutor') {
                navigate('/tutor-setup');
            } else if (result.user && result.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/student');
            }
        } else {
            // Provide more specific error messages
            let errorMessage = result.error;

            // Handle validation errors with specific field information
            if (errorMessage.includes('Validation failed') && result.errors && Array.isArray(result.errors)) {
                const fieldErrors = result.errors.map(error => {
                    switch (error.path) {
                        case 'email':
                            return 'Please enter a valid email address.';
                        case 'password':
                            return 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
                        case 'firstName':
                            return 'First name is required and must be less than 100 characters.';
                        case 'lastName':
                            return 'Last name is required and must be less than 100 characters.';
                        case 'role':
                            return 'Please select a valid role (Student or Tutor).';
                        case 'dateOfBirth':
                            return 'Please enter a valid date of birth.';
                        case 'address':
                            return 'Address must be less than 500 characters.';
                        default:
                            return error.msg || `${error.path}: ${error.value} is invalid`;
                    }
                });
                errorMessage = fieldErrors.join('. ');
            } else if (errorMessage.includes('User already exists')) {
                errorMessage = 'An account with this email address already exists. Please try signing in instead.';
            } else if (errorMessage.includes('email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (errorMessage.includes('password')) {
                errorMessage = 'Password does not meet the requirements. Please ensure it has at least 8 characters with uppercase, lowercase, and numbers.';
            }
            setError(errorMessage);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AuthNavbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                            >
                                sign in to your existing account
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <Alert
                                type="error"
                                message={error}
                                onClose={() => setError('')}
                            />
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        required
                                        className="input-field mt-1"
                                        placeholder="First name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        required
                                        className="input-field mt-1"
                                        placeholder="Last name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input-field mt-1"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                    I want to join as a
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    className="input-field mt-1"
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="student">Student (Looking for tutoring)</option>
                                    <option value="tutor">Tutor (Offering tutoring services)</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number (Optional)
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="input-field mt-1"
                                    placeholder="Enter your phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                                    Date of Birth (Optional)
                                </label>
                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    className="input-field mt-1"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    disabled={loading}
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                                />
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Address (Optional)
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    className="input-field mt-1"
                                    placeholder="Enter your full address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={loading}
                                    maxLength={500}
                                />
                            </div>

                            <div>
                                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                                    Pincode/ZIP Code (Optional)
                                </label>
                                <input
                                    id="pincode"
                                    name="pincode"
                                    type="text"
                                    className="input-field mt-1"
                                    placeholder="Enter your pincode or ZIP code"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    disabled={loading}
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        className="input-field pr-10"
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={formData.password} />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        className="input-field pr-10"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="btn-primary w-full flex justify-center"
                                disabled={loading}
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;