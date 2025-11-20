import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { adminService } from '../services';

const AdminPlatformSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [newSetting, setNewSetting] = useState({
        key: '',
        value: '',
        category: '',
        description: '',
        dataType: 'string',
        isPublic: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getSettings();
            setSettings(data.settings || data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError('Failed to load settings');
            // Fallback mock data
            setSettings({
                'Platform': [
                    { id: 1, key: 'platform_name', value: 'TutorConnect', description: 'Platform name displayed to users', dataType: 'string', isPublic: true },
                    { id: 2, key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode', dataType: 'boolean', isPublic: false }
                ],
                'Payment': [
                    { id: 3, key: 'platform_fee', value: '20', description: 'Platform fee percentage', dataType: 'number', isPublic: false },
                    { id: 4, key: 'min_session_duration', value: '30', description: 'Minimum session duration in minutes', dataType: 'number', isPublic: true }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSetting = async (settingKey, newValue, description) => {
        try {
            setSaving(true);
            await adminService.updateSetting(settingKey, { value: newValue, description });

            // Update local state
            setSettings(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(category => {
                    updated[category] = updated[category].map(setting =>
                        setting.key === settingKey
                            ? { ...setting, value: newValue, description }
                            : setting
                    );
                });
                return updated;
            });

            setEditingSetting(null);
        } catch (err) {
            console.error('Failed to save setting:', err);
            setError('Failed to save setting');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSetting = async () => {
        try {
            setSaving(true);
            await adminService.createSetting(newSetting);
            await fetchSettings(); // Refresh all settings
            setShowAddModal(false);
            setNewSetting({
                key: '',
                value: '',
                category: '',
                description: '',
                dataType: 'string',
                isPublic: false
            });
        } catch (err) {
            console.error('Failed to add setting:', err);
            setError('Failed to add setting');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSetting = async (settingKey) => {
        if (!window.confirm('Are you sure you want to delete this setting?')) return;

        try {
            await adminService.deleteSetting(settingKey);
            await fetchSettings(); // Refresh all settings
        } catch (err) {
            console.error('Failed to delete setting:', err);
            setError('Failed to delete setting');
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                    <p className="text-gray-600 mt-1">Manage system-wide configuration settings</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={fetchSettings}
                        className="ml-auto text-red-700 underline hover:text-red-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {Object.entries(settings).map(([category, categorySettings]) => (
                    <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">{category} Settings</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {categorySettings.map((setting) => (
                                    <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-medium text-gray-900">{setting.key}</h3>
                                                {setting.isPublic && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        Public
                                                    </span>
                                                )}
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                    {setting.dataType}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                                            {editingSetting === setting.key ? (
                                                <div className="mt-3 space-y-2">
                                                    <input
                                                        type={setting.dataType === 'number' ? 'number' : 'text'}
                                                        defaultValue={setting.value}
                                                        id={`edit-${setting.key}`}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        defaultValue={setting.description}
                                                        placeholder="Description"
                                                        id={`edit-desc-${setting.key}`}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                const newValue = document.getElementById(`edit-${setting.key}`).value;
                                                                const newDesc = document.getElementById(`edit-desc-${setting.key}`).value;
                                                                handleSaveSetting(setting.key, newValue, newDesc);
                                                            }}
                                                            disabled={saving}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {saving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSetting(null)}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
                                                        {setting.dataType === 'boolean'
                                                            ? (setting.value === 'true' ? 'Enabled' : 'Disabled')
                                                            : setting.value
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setEditingSetting(setting.key)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                                title="Edit setting"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSetting(setting.key)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                title="Delete setting"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Setting Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Add New Setting</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                                <input
                                    type="text"
                                    value={newSetting.key}
                                    onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="setting_key"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                <input
                                    type="text"
                                    value={newSetting.value}
                                    onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="setting_value"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={newSetting.category}
                                    onChange={(e) => setNewSetting(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Platform, Payment, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newSetting.description}
                                    onChange={(e) => setNewSetting(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Describe what this setting does..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                                    <select
                                        value={newSetting.dataType}
                                        onChange={(e) => setNewSetting(prev => ({ ...prev, dataType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="json">JSON</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newSetting.isPublic}
                                            onChange={(e) => setNewSetting(prev => ({ ...prev, isPublic: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Public Setting</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSetting}
                                disabled={saving || !newSetting.key || !newSetting.value || !newSetting.category}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Adding...' : 'Add Setting'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlatformSettings;