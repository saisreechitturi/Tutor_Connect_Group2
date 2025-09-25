import React, { useState } from 'react';
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
    Clock
} from 'lucide-react';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        // General Settings
        siteName: 'TutorConnect',
        siteDescription: 'Connect with expert tutors for personalized learning',
        contactEmail: 'admin@tutorconnect.com',
        supportEmail: 'support@tutorconnect.com',
        timezone: 'America/New_York',
        language: 'en',

        // Security Settings
        requireEmailVerification: true,
        enableTwoFactor: false,
        sessionTimeout: 24, // hours
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireStrongPasswords: true,

        // Payment Settings
        paypalEnabled: true,
        paypalSandbox: true,
        commissionRate: 15, // percentage
        minimumPayout: 50,
        payoutSchedule: 'weekly',

        // User Management
        autoApprovalTutors: false,
        requireTutorVerification: true,
        maxStudentsPerTutor: 50,
        allowPublicProfiles: true,

        // Notifications
        emailNotifications: true,
        systemAlerts: true,
        maintenanceMode: false,
        welcomeEmailEnabled: true,

        // Platform Settings
        maxSessionDuration: 180, // minutes
        bookingAdvanceTime: 24, // hours
        cancellationPeriod: 2, // hours
        allowRecordingSessions: true
    });

    const [saved, setSaved] = useState(false);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        // In a real app, this would save to backend
        console.log('Saving settings:', settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'payment', name: 'Payments', icon: DollarSign },
        { id: 'users', name: 'User Management', icon: Users },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'platform', name: 'Platform', icon: Globe }
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
                            value={settings.siteName}
                            onChange={(e) => handleSettingChange('siteName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Description
                        </label>
                        <textarea
                            value={settings.siteDescription}
                            onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
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
                            value={settings.supportEmail}
                            onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                        </label>
                        <select
                            value={settings.timezone}
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
                            checked={settings.requireEmailVerification}
                            onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
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
                            checked={settings.enableTwoFactor}
                            onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
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
                            checked={settings.requireStrongPasswords}
                            onChange={(e) => handleSettingChange('requireStrongPasswords', e.target.checked)}
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
                            value={settings.sessionTimeout}
                            onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
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
                            value={settings.maxLoginAttempts}
                            onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
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
                            value={settings.passwordMinLength}
                            onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
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
            default:
                return renderGeneralSettings();
        }
    };

    return (
        <div className="space-y-6">
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
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${saved
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-purple-600 hover:bg-gray-100'
                            }`}
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {saved ? 'Saved!' : 'Save Changes'}
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
        </div>
    );
};

export default AdminSettings;