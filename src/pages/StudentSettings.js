import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Bell, Shield, CreditCard, Trash2, Save } from 'lucide-react';

const StudentSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        phone: user?.profile?.phone || '',
        location: user?.profile?.location || '',
        bio: user?.profile?.bio || '',
        avatar: user?.profile?.avatar || ''
    });

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        weeklyDigest: false,
        promotionalEmails: false
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowMessages: true
    });

    const handleInputChange = (section, field, value) => {
        if (section === 'profile') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else if (section === 'notifications') {
            setNotifications(prev => ({ ...prev, [field]: value }));
        } else if (section === 'privacy') {
            setPrivacy(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = (section) => {
        // Mock save functionality
        console.log(`Saving ${section} settings:`, section === 'profile' ? formData : section === 'notifications' ? notifications : privacy);
        alert(`${section} settings saved successfully!`);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>

                                {/* Avatar Section */}
                                <div className="flex items-center space-x-6 mb-6">
                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                                        <img
                                            src={formData.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <button className="btn-primary text-sm">Change Photo</button>
                                        <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="inline h-4 w-4 mr-1" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Phone className="inline h-4 w-4 mr-1" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="inline h-4 w-4 mr-1" />
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
                                            className="input-field"
                                            placeholder="City, State/Country"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={formData.bio}
                                            onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                                            className="input-field"
                                            placeholder="Tell us about yourself, your interests, and learning goals..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => handleSave('profile')}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                                <p className="text-gray-600 mb-6">Choose how you want to be notified about activities and updates.</p>

                                <div className="space-y-4">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in your browser' },
                                        { key: 'sessionReminders', label: 'Session Reminders', description: 'Get reminded before your tutoring sessions' },
                                        { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a weekly summary of your activities' },
                                        { key: 'promotionalEmails', label: 'Promotional Emails', description: 'Receive emails about new features and offers' }
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{label}</h4>
                                                <p className="text-sm text-gray-500">{description}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={notifications[key]}
                                                    onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => handleSave('notifications')}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>Save Preferences</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                                <p className="text-gray-600 mb-6">Control who can see your information and how you can be contacted.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Profile Visibility
                                        </label>
                                        <select
                                            value={privacy.profileVisibility}
                                            onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="public">Public - Anyone can see your profile</option>
                                            <option value="tutors">Tutors Only - Only tutors can see your profile</option>
                                            <option value="private">Private - Only you can see your profile</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'showEmail', label: 'Show Email Address', description: 'Display your email address on your public profile' },
                                            { key: 'showPhone', label: 'Show Phone Number', description: 'Display your phone number on your public profile' },
                                            { key: 'allowMessages', label: 'Allow Direct Messages', description: 'Let tutors send you direct messages' }
                                        ].map(({ key, label, description }) => (
                                            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{label}</h4>
                                                    <p className="text-sm text-gray-500">{description}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={privacy[key]}
                                                        onChange={(e) => handleInputChange('privacy', key, e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => handleSave('privacy')}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>Save Privacy Settings</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Payment</h3>
                                <p className="text-gray-600 mb-6">Manage your payment methods and billing information.</p>

                                {/* Payment Methods */}
                                <div className="mb-8">
                                    <h4 className="font-medium text-gray-900 mb-4">Payment Methods</h4>
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <CreditCard className="h-8 w-8 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                                                    <p className="text-sm text-gray-500">Expires 12/25</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary text-sm">Edit</button>
                                        </div>
                                    </div>
                                    <button className="btn-outline mt-4">Add New Payment Method</button>
                                </div>

                                {/* Billing History */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-4">Recent Transactions</h4>
                                    <div className="space-y-2">
                                        {[
                                            { date: 'Sep 10, 2025', description: 'JavaScript Tutoring Session - Sai Sree Chitturi', amount: '$45.00' },
                                            { date: 'Sep 8, 2025', description: 'Calculus Tutoring Session - Chandan Cheni', amount: '$60.00' },
                                            { date: 'Sep 5, 2025', description: 'Physics Tutoring Session - Maatheswaran Kannan Chellapandian', amount: '$55.00' }
                                        ].map((transaction, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{transaction.description}</p>
                                                    <p className="text-sm text-gray-500">{transaction.date}</p>
                                                </div>
                                                <p className="font-medium text-gray-900">{transaction.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn-outline mt-4">View All Transactions</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Deletion Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                    <Trash2 className="h-6 w-6 text-red-600 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-red-900">Delete Account</h3>
                        <p className="text-red-700 mt-1">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button className="btn-danger mt-4">Delete My Account</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;