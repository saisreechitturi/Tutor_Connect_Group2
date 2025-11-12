import React, { useState, useEffect } from 'react';
import { adminService } from '../services';
import {
    Settings,
    Shield,
    Mail,
    Globe,
    DollarSign,
    Users,
    BookOpen,
    AlertTriangle,
    Save,
    Database,
    Key,
    Bell,
    Clock,
    CheckCircle,
    X
} from 'lucide-react';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getSettings();

            // Transform the grouped settings into a flat object for easier handling
            const flatSettings = {};
            Object.values(response).flat().forEach(setting => {
                flatSettings[setting.key] = {
                    value: setting.value,
                    description: setting.description,
                    dataType: setting.dataType,
                    category: setting.key.split('_')[0] // Extract category from key
                };
            });

            setSettings(flatSettings);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                value: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Update each changed setting
            const updatePromises = Object.entries(settings).map(([key, setting]) => {
                return adminService.updateSetting(key, {
                    value: setting.value,
                    description: setting.description
                });
            });

            await Promise.all(updatePromises);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Helper function to get setting value with fallback
    const getSettingValue = (key, fallback = '') => {
        return settings[key]?.value || fallback;
    };

    // Helper function to get boolean setting value
    const getBooleanSetting = (key, fallback = false) => {
        const value = settings[key]?.value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return fallback;
    };

    // Helper function to get number setting value
    const getNumberSetting = (key, fallback = 0) => {
        const value = settings[key]?.value;
        return value ? parseInt(value) : fallback;
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'security', name: 'Security', icon: Key },
        { id: 'payment', name: 'Payments', icon: DollarSign },
        { id: 'users', name: 'User Management', icon: Users },
        { id: 'notifications', name: 'Notifications', icon: Mail },
        { id: 'platform', name: 'Platform', icon: Clock },
        { id: 'database', name: 'Database', icon: Database },
        { id: 'content', name: 'Content', icon: BookOpen }
    ];

    const renderGeneralSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Site Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Name
                        </label>
                        <input
                            type="text"
                            value={getSettingValue('site_name', 'TutorConnect')}
                            onChange={(e) => handleSettingChange('site_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={getSettingValue('contact_email', 'admin@tutorconnect.com')}
                            onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Description
                        </label>
                        <textarea
                            value={getSettingValue('site_description', 'Connect with expert tutors for personalized learning')}
                            onChange={(e) => handleSettingChange('site_description', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Support Email
                        </label>
                        <input
                            type="email"
                            value={getSettingValue('support_email', 'support@tutorconnect.com')}
                            onChange={(e) => handleSettingChange('support_email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                        </label>
                        <select
                            value={getSettingValue('timezone', 'America/New_York')}
                            onChange={(e) => handleSettingChange('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication & Security</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Require Email Verification
                            </label>
                            <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={getBooleanSetting('require_email_verification', true)}
                            onChange={(e) => handleSettingChange('require_email_verification', e.target.checked.toString())}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Enable Two-Factor Authentication
                            </label>
                            <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={getBooleanSetting('enable_two_factor', false)}
                            onChange={(e) => handleSettingChange('enable_two_factor', e.target.checked.toString())}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Require Strong Passwords
                            </label>
                            <p className="text-sm text-gray-500">Enforce complex password requirements</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={getBooleanSetting('require_strong_passwords', true)}
                            onChange={(e) => handleSettingChange('require_strong_passwords', e.target.checked.toString())}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (hours)
                        </label>
                        <input
                            type="number"
                            value={getNumberSetting('session_timeout', 24)}
                            onChange={(e) => handleSettingChange('session_timeout', e.target.value)}
                            min="1"
                            max="168"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Login Attempts
                        </label>
                        <input
                            type="number"
                            value={getNumberSetting('max_login_attempts', 5)}
                            onChange={(e) => handleSettingChange('max_login_attempts', e.target.value)}
                            min="3"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Password Length
                        </label>
                        <input
                            type="number"
                            value={getNumberSetting('password_min_length', 8)}
                            onChange={(e) => handleSettingChange('password_min_length', e.target.value)}
                            min="6"
                            max="20"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPaymentSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                PayPal Integration Enabled
                            </label>
                            <p className="text-sm text-gray-500">Enable PayPal payments for sessions</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.paypalEnabled}
                            onChange={(e) => handleSettingChange('paypalEnabled', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                PayPal Sandbox Mode
                            </label>
                            <p className="text-sm text-gray-500">Use PayPal sandbox for testing</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.paypalSandbox}
                            onChange={(e) => handleSettingChange('paypalSandbox', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platform Commission Rate (%)
                        </label>
                        <input
                            type="number"
                            value={settings.commissionRate}
                            onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                            min="0"
                            max="30"
                            step="0.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentage taken from each transaction</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Payout ($)
                        </label>
                        <input
                            type="number"
                            value={settings.minimumPayout}
                            onChange={(e) => handleSettingChange('minimumPayout', parseFloat(e.target.value))}
                            min="10"
                            max="500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payout Schedule
                        </label>
                        <select
                            value={settings.payoutSchedule}
                            onChange={(e) => handleSettingChange('payoutSchedule', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUserSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Auto-Approve Tutors
                            </label>
                            <p className="text-sm text-gray-500">Automatically approve tutor applications</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.autoApprovalTutors}
                            onChange={(e) => handleSettingChange('autoApprovalTutors', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Require Tutor Verification
                            </label>
                            <p className="text-sm text-gray-500">Require identity verification for tutors</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.requireTutorVerification}
                            onChange={(e) => handleSettingChange('requireTutorVerification', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Allow Public Profiles
                            </label>
                            <p className="text-sm text-gray-500">Users can make their profiles publicly visible</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.allowPublicProfiles}
                            onChange={(e) => handleSettingChange('allowPublicProfiles', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Students Per Tutor
                    </label>
                    <input
                        type="number"
                        value={settings.maxStudentsPerTutor}
                        onChange={(e) => handleSettingChange('maxStudentsPerTutor', parseInt(e.target.value))}
                        min="1"
                        max="200"
                        className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Email Notifications
                            </label>
                            <p className="text-sm text-gray-500">Send email notifications to users</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                System Alerts
                            </label>
                            <p className="text-sm text-gray-500">Send system alerts and announcements</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.systemAlerts}
                            onChange={(e) => handleSettingChange('systemAlerts', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Welcome Email
                            </label>
                            <p className="text-sm text-gray-500">Send welcome email to new users</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.welcomeEmailEnabled}
                            onChange={(e) => handleSettingChange('welcomeEmailEnabled', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-red-700">
                                    Maintenance Mode
                                </label>
                                <p className="text-sm text-red-600">Put the platform in maintenance mode</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-red-300 rounded"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlatformSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Session Duration (minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.maxSessionDuration}
                            onChange={(e) => handleSettingChange('maxSessionDuration', parseInt(e.target.value))}
                            min="30"
                            max="480"
                            step="15"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Booking Advance Time (hours)
                        </label>
                        <input
                            type="number"
                            value={settings.bookingAdvanceTime}
                            onChange={(e) => handleSettingChange('bookingAdvanceTime', parseInt(e.target.value))}
                            min="1"
                            max="168"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum time before session can be booked</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Period (hours)
                        </label>
                        <input
                            type="number"
                            value={settings.cancellationPeriod}
                            onChange={(e) => handleSettingChange('cancellationPeriod', parseInt(e.target.value))}
                            min="1"
                            max="48"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Hours before session when cancellation is allowed</p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Allow Session Recording
                            </label>
                            <p className="text-sm text-gray-500">Allow tutors and students to record sessions</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.allowRecordingSessions}
                            onChange={(e) => handleSettingChange('allowRecordingSessions', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDatabaseSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                            <Database className="h-5 w-5 text-blue-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-blue-700">
                                    Database Backup
                                </label>
                                <p className="text-sm text-blue-600">Schedule automatic database backups</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Configure
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContentSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Content Management</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center">
                            <BookOpen className="h-5 w-5 text-green-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-green-700">
                                    Content Moderation
                                </label>
                                <p className="text-sm text-green-600">Manage and moderate platform content</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Manage
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralSettings();
            case 'security':
                return renderSecuritySettings();
            case 'payment':
                return renderPaymentSettings();
            case 'users':
                return renderUserSettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'platform':
                return renderPlatformSettings();
            case 'database':
                return renderDatabaseSettings();
            case 'content':
                return renderContentSettings();
            default:
                return renderGeneralSettings();
        }
    };

    return (
        <div className="space-y-6">
            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Loading settings...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-red-800">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center">
                                    <Settings className="h-8 w-8 mr-3" />
                                    Admin Settings
                                </h1>
                                <p className="mt-2 text-purple-100">
                                    Configure platform settings, security, and user management options.
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${saved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-purple-600 hover:bg-gray-100'
                                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {saved ? <CheckCircle className="h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        {saved ? 'Saved!' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id
                                                ? 'border-purple-500 text-purple-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5 mr-2" />
                                            {tab.name}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {renderTabContent()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminSettings;