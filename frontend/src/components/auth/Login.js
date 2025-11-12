import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import AuthNavbar from './AuthNavbar';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showErrorShake, setShowErrorShake] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [showWrongPasswordModal, setShowWrongPasswordModal] = useState(false);

    const passwordInputRef = useRef(null);

    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const successMessage = location.state?.message;

    // Prefill email from previous attempts in this tab
    useEffect(() => {
        const savedEmail = sessionStorage.getItem('loginEmail');
        if (savedEmail && !formData.email) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
        }
    }, []);

    // Focus the password field when the wrong-password modal closes
    useEffect(() => {
        if (!showWrongPasswordModal && passwordInputRef.current) {
            passwordInputRef.current.focus();
        }
    }, [showWrongPasswordModal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'email') {
            sessionStorage.setItem('loginEmail', value.trim());
        }
        // Clear error and shake animation when user starts typing
        if (error) {
            setError('');
            setShowErrorShake(false);
        }
    };

    const validateForm = () => {
        if (!formData.email) {
            setError('Email address is required');
            return false;
        }
        if (!formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        const result = await login(formData.email, formData.password);

        if (!result.success) {
            // Provide more specific error messages
            let errorMessage = result.error || 'Login failed. Please try again.';

            console.log('Login error:', errorMessage); // Debug log

            if (errorMessage.includes('Invalid email or password')) {
                errorMessage = '❌ The email or password you entered is incorrect. Please try again.';
            } else if (errorMessage.includes('Account is not active')) {
                errorMessage = '⚠️ Your account has been deactivated. Please contact support for assistance.';
            } else if (errorMessage.includes('Authentication failed')) {
                errorMessage = '🔒 Unable to sign in. Please check your credentials and try again.';
            } else if (errorMessage.includes('Validation failed')) {
                errorMessage = '⚠️ Please check your email and password format.';
            } else if (errorMessage.includes('HTTP Error: 401')) {
                errorMessage = '❌ Wrong email or password. Please check your credentials and try again.';
            } else if (errorMessage.includes('Unable to connect to server')) {
                errorMessage = '🌐 Unable to connect to server. Please check your internet connection and try again.';
            } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
                errorMessage = '🌐 Network error. Please check your connection and try again.';
            }

            // Determine if this is a wrong password/email case
            const isWrongCred = (
                errorMessage.includes('Invalid email or password') ||
                errorMessage.includes('Wrong email or password') ||
                errorMessage.includes('HTTP Error: 401') ||
                errorMessage.toLowerCase().includes('unauthorized')
            );

            if (isWrongCred) {
                // increment attempts and either show modal or redirect if over limit
                setAttempts(prev => {
                    const next = prev + 1;
                    if (next >= 5) {
                        // redirect to forgot password with email preserved
                        navigate('/forgot-password', { state: { email: formData.email } });
                    } else {
                        setShowWrongPasswordModal(true);
                    }
                    return next;
                });

                // clear only the password field for retry; keep email as requested
                setFormData(prev => ({ ...prev, password: '' }));
                setError('');
            } else {
                // Other types of errors surface as inline alert
                setError(errorMessage);
            }

            // Add shake animation for visual feedback
            setShowErrorShake(true);
            setTimeout(() => setShowErrorShake(false), 1000);
        } else {
            // on success clear persisted email
            sessionStorage.removeItem('loginEmail');
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
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                            >
                                create a new account
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {successMessage && (
                            <Alert
                                type="success"
                                message={successMessage}
                                onClose={() => window.history.replaceState({}, document.title)}
                            />
                        )}

                        {error && (
                            <Alert
                                type="error"
                                message={error}
                                onClose={() => setError('')}
                            />
                        )}

                        <div className="space-y-4">
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
                                    className={`input-field mt-1 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${showErrorShake ? 'animate-pulse' : ''}`}
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
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
                                        autoComplete="current-password"
                                        required
                                        className={`input-field pr-10 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${showErrorShake ? 'animate-pulse' : ''}`}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        ref={passwordInputRef}
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
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="btn-primary w-full flex justify-center"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                    </form>

                    {/* Wrong password modal */}
                    <Modal
                        isOpen={showWrongPasswordModal}
                        title="Incorrect email or password"
                        onClose={() => setShowWrongPasswordModal(false)}
                        primaryAction={{
                            label: `Try again (${attempts}/5)`,
                            onClick: () => setShowWrongPasswordModal(false)
                        }}
                        secondaryAction={{
                            label: 'Forgot password',
                            onClick: () => navigate('/forgot-password', { state: { email: formData.email } })
                        }}
                    >
                        <p className="text-sm text-gray-700">
                            The email or password you entered is incorrect. You have {Math.max(0, 5 - attempts)} attempts left before we redirect you to reset your password.
                        </p>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default Login;