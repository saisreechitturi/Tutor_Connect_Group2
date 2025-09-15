import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Bell, Shield, CreditCard, DollarSign, Clock, Calendar, Save, Star, Award } from 'lucide-react';

const TutorSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const [profileData, setProfileData] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        phone: user?.profile?.phone || '',
        location: user?.profile?.location || '',
        bio: user?.profile?.bio || '',
        avatar: user?.profile?.avatar || '',
        title: 'Full-Stack Developer & Tutor',
        specializations: ['JavaScript', 'React', 'Node.js', 'Full-Stack Development'],
        education: ['BS Computer Science, Stanford University'],
        certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
        experience: '5+ years',
        languages: ['English', 'Spanish']
    });

    const [rateSettings, setRateSettings] = useState({
        hourlyRate: 45,
        packageRates: {
            '5hours': 200,
            '10hours': 380,
            '20hours': 720
        },
        subjects: [
            { name: 'JavaScript', rate: 45, active: true },
            { name: 'React', rate: 50, active: true },
            { name: 'Node.js', rate: 48, active: true },
            { name: 'Full-Stack Development', rate: 55, active: true }
        ]
    });

    const [availability, setAvailability] = useState({
        timezone: 'America/Los_Angeles',
        schedule: {
            monday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
            tuesday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
            wednesday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }] },
            thursday: { enabled: true, slots: [{ start: '14:00', end: '18:00' }] },
            friday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
            saturday: { enabled: true, slots: [{ start: '10:00', end: '14:00' }] },
            sunday: { enabled: false, slots: [] }
        },
        bufferTime: 15,
        maxSessionsPerDay: 6,
        autoAcceptBookings: false
    });

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        newBookingAlerts: true,
        paymentNotifications: true,
        studentMessageAlerts: true,
        weeklyEarningsReport: true,
        marketingEmails: false
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowDirectBookings: true,
        showAvailability: true,
        allowReviews: true
    });

    const handleInputChange = (section, field, value) => {
        if (section === 'profile') {
            setProfileData(prev => ({ ...prev, [field]: value }));
        } else if (section === 'notifications') {
            setNotifications(prev => ({ ...prev, [field]: value }));
        } else if (section === 'privacy') {
            setPrivacy(prev => ({ ...prev, [field]: value }));
        } else if (section === 'rates') {
            setRateSettings(prev => ({ ...prev, [field]: value }));
        } else if (section === 'availability') {
            setAvailability(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = (section) => {
        console.log(`Saving ${section} settings`);
        alert(`${section} settings saved successfully!`);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'rates', label: 'Rates & Pricing', icon: DollarSign },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'payments', label: 'Payments', icon: CreditCard }
    ];

    const TimeSlotManager = ({ day, slots, onUpdate }) => (
        <div className="space-y-2">
            {slots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input
                        type="time"
                        value={slot.start}
                        className="input-field text-sm py-1"
                        onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index].start = e.target.value;
                            onUpdate(day, newSlots);
                        }}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                        type="time"
                        value={slot.end}
                        className="input-field text-sm py-1"
                        onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index].end = e.target.value;
                            onUpdate(day, newSlots);
                        }}
                    />
                    <button
                        onClick={() => {
                            const newSlots = slots.filter((_, i) => i !== index);
                            onUpdate(day, newSlots);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                </div>
            ))}
            <button
                onClick={() => {
                    const newSlots = [...slots, { start: '09:00', end: '10:00' }];
                    onUpdate(day, newSlots);
                }}
                className="text-primary-600 hover:text-primary-800 text-sm"
            >
                + Add Time Slot
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Tutor Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your tutoring profile and preferences</p>
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
                                            src={profileData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                                        <input
                                            type="text"
                                            value={profileData.title}
                                            onChange={(e) => handleInputChange('profile', 'title', e.target.value)}
                                            className="input-field"
                                            placeholder="e.g. Senior Software Engineer & Tutor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                                        <select
                                            value={profileData.experience}
                                            onChange={(e) => handleInputChange('profile', 'experience', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="1-2 years">1-2 years</option>
                                            <option value="3-5 years">3-5 years</option>
                                            <option value="5+ years">5+ years</option>
                                            <option value="10+ years">10+ years</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                        <textarea
                                            rows={4}
                                            value={profileData.bio}
                                            onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                                            className="input-field"
                                            placeholder="Tell students about your background, teaching style, and expertise..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                                        <input
                                            type="text"
                                            value={profileData.specializations.join(', ')}
                                            onChange={(e) => handleInputChange('profile', 'specializations', e.target.value.split(', '))}
                                            className="input-field"
                                            placeholder="JavaScript, React, Node.js..."
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

                    {/* Availability tab removed per scope simplification */}

                    {activeTab === 'rates' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Rates & Pricing</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Hourly Rate</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                value={rateSettings.hourlyRate}
                                                onChange={(e) => handleInputChange('rates', 'hourlyRate', parseFloat(e.target.value))}
                                                className="input-field pl-8"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Subject-Specific Rates</h4>
                                    <div className="space-y-3">
                                        {rateSettings.subjects.map((subject, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={subject.active}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="font-medium text-gray-900">{subject.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        value={subject.rate}
                                                        className="input-field w-20 text-center py-1"
                                                    />
                                                    <span className="text-gray-500">/hour</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => handleSave('rates')}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>Save Rates</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>

                                <div className="space-y-4">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications' },
                                        { key: 'sessionReminders', label: 'Session Reminders', description: 'Get reminded before sessions' },
                                        { key: 'newBookingAlerts', label: 'New Booking Alerts', description: 'Notify when students book sessions' },
                                        { key: 'paymentNotifications', label: 'Payment Notifications', description: 'Updates about payments and earnings' },
                                        { key: 'studentMessageAlerts', label: 'Student Messages', description: 'Alerts for new student messages' },
                                        { key: 'weeklyEarningsReport', label: 'Weekly Earnings Report', description: 'Weekly summary of your earnings' },
                                        { key: 'marketingEmails', label: 'Marketing Emails', description: 'Tips and platform updates' }
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

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                                        <select
                                            value={privacy.profileVisibility}
                                            onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="public">Public - Anyone can find and book you</option>
                                            <option value="students">Students Only - Only your students can see details</option>
                                            <option value="private">Private - Hidden from search</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'allowDirectBookings', label: 'Allow Direct Bookings', description: 'Students can book sessions without approval' },
                                            { key: 'showAvailability', label: 'Show Availability', description: 'Display your available time slots publicly' },
                                            { key: 'allowReviews', label: 'Allow Student Reviews', description: 'Students can leave reviews on your profile' },
                                            { key: 'showEmail', label: 'Show Email Address', description: 'Display your email on your profile' },
                                            { key: 'showPhone', label: 'Show Phone Number', description: 'Display your phone number on your profile' }
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

                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>

                                {/* Bank Account */}
                                <div className="mb-8">
                                    <h4 className="font-medium text-gray-900 mb-4">Bank Account</h4>
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <CreditCard className="h-8 w-8 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Chase Bank •••• 4242</p>
                                                    <p className="text-sm text-gray-500">Primary account for payments</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary text-sm">Update</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Earnings Summary */}
                                <div className="mb-8">
                                    <h4 className="font-medium text-gray-900 mb-4">Earnings Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-600">This Month</p>
                                            <p className="text-2xl font-bold text-green-600">$2,450</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-blue-600">Pending</p>
                                            <p className="text-2xl font-bold text-blue-600">$340</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Earned</p>
                                            <p className="text-2xl font-bold text-gray-900">$12,840</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Schedule */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-4">Payment Schedule</h4>
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-medium text-gray-900">Weekly Payments</span>
                                            <span className="text-sm text-gray-500">Every Friday</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Payments are processed weekly and typically arrive in your account within 2-3 business days.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorSettings;