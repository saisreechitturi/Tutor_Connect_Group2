import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profiles } from '../services';
import { User, Mail, Phone, Save } from 'lucide-react';

const learningStyleOptions = [
    { value: 'visual', label: 'Visual' },
    { value: 'auditory', label: 'Auditory' },
    { value: 'kinesthetic', label: 'Kinesthetic' },
    { value: 'reading', label: 'Reading/Writing' },
    { value: 'both', label: 'Both / Mixed' }
];

const StudentSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'success' | 'error'

    const [baseForm, setBaseForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        profileImage: ''
    });

    const [studentForm, setStudentForm] = useState({
        gradeLevel: '',
        schoolName: '',
        learningGoals: '',
        preferredLearningStyle: '',
        subjectsOfInterest: '', // comma-separated for UI
        emergencyName: '',
        emergencyPhone: '',
        emergencyEmail: '',
        availabilityNotes: ''
    });

    // Load current profile
    useEffect(() => {
        const load = async () => {
            if (!user?.id) return;
            try {
                const data = await profiles.getByUserId(user.id);
                const p = data?.profile || {};
                const sp = p.studentProfile || {};

                setBaseForm({
                    firstName: p.firstName || '',
                    lastName: p.lastName || '',
                    email: p.email || user.email || '',
                    phone: p.phone || '',
                    bio: p.bio || '',
                    profileImage: p.profileImage || ''
                });

                const emergency = sp.emergencyContact || {};
                const availability = sp.availabilitySchedule || {};

                setStudentForm({
                    gradeLevel: sp.gradeLevel || '',
                    schoolName: sp.schoolName || '',
                    learningGoals: sp.learningGoals || '',
                    preferredLearningStyle: sp.preferredLearningStyle || '',
                    subjectsOfInterest: Array.isArray(sp.subjectsOfInterest) ? sp.subjectsOfInterest.join(', ') : '',
                    emergencyName: emergency.name || '',
                    emergencyPhone: emergency.phone || '',
                    emergencyEmail: emergency.email || '',
                    availabilityNotes: availability.notes || ''
                });
            } catch (err) {
                console.error('Failed to load student profile:', err);
            }
        };
        load();
    }, [user]);

    const handleBaseChange = (field, value) => setBaseForm(prev => ({ ...prev, [field]: value }));
    const handleStudentChange = (field, value) => setStudentForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!user?.id) return;
        setLoading(true);
        setSaveStatus('saving');
        try {
            // Update base user fields
            const { firstName, lastName, phone, bio, profileImage } = baseForm;
            await profiles.updateUser(user.id, { firstName, lastName, phone, bio, profileImage });

            // Update student profile fields
            const {
                gradeLevel, schoolName, learningGoals, preferredLearningStyle,
                subjectsOfInterest, emergencyName, emergencyPhone, emergencyEmail, availabilityNotes
            } = studentForm;

            const payload = {};
            if (gradeLevel) payload.gradeLevel = gradeLevel;
            if (schoolName) payload.schoolName = schoolName;
            if (learningGoals) payload.learningGoals = learningGoals;
            if (preferredLearningStyle) payload.preferredLearningStyle = preferredLearningStyle;
            const subjectsArr = subjectsOfInterest
                ? subjectsOfInterest.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            if (subjectsArr.length) payload.subjectsOfInterest = subjectsArr;
            if (availabilityNotes) payload.availabilitySchedule = { notes: availabilityNotes };
            const emergency = {
                name: emergencyName || '',
                phone: emergencyPhone || '',
                email: emergencyEmail || ''
            };
            // Only send emergencyContact if any field provided
            if (emergency.name || emergency.phone || emergency.email) payload.emergencyContact = emergency;

            await profiles.updateStudent(user.id, payload);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2500);
        } catch (err) {
            console.error('Failed to save profile:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                    <p className="text-gray-600 mt-1">Update your personal details and learning preferences</p>
                </div>

                <div className="p-6 space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input type="text" className="input-field" value={baseForm.firstName} onChange={(e) => handleBaseChange('firstName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input type="text" className="input-field" value={baseForm.lastName} onChange={(e) => handleBaseChange('lastName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Mail className="h-4 w-4" /> Email (read-only)
                                </label>
                                <input type="email" className="input-field bg-gray-50" value={baseForm.email} disabled readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Phone className="h-4 w-4" /> Phone Number
                                </label>
                                <input type="tel" className="input-field" value={baseForm.phone} onChange={(e) => handleBaseChange('phone', e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea rows={4} className="input-field" value={baseForm.bio} onChange={(e) => handleBaseChange('bio', e.target.value)} placeholder="Tell us about yourself and your learning goals..." />
                            </div>
                        </div>
                    </section>

                    {/* Student Profile */}
                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                                <input type="text" className="input-field" placeholder="e.g., 10th Grade or Sophomore" value={studentForm.gradeLevel} onChange={(e) => handleStudentChange('gradeLevel', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">School / Institution</label>
                                <input type="text" className="input-field" value={studentForm.schoolName} onChange={(e) => handleStudentChange('schoolName', e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Goals</label>
                                <textarea rows={3} className="input-field" value={studentForm.learningGoals} onChange={(e) => handleStudentChange('learningGoals', e.target.value)} placeholder="What would you like to achieve?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning Style</label>
                                <select className="input-field" value={studentForm.preferredLearningStyle} onChange={(e) => handleStudentChange('preferredLearningStyle', e.target.value)}>
                                    <option value="">Select style</option>
                                    {learningStyleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects of Interest</label>
                                <input type="text" className="input-field" placeholder="e.g., Math, Physics, English" value={studentForm.subjectsOfInterest} onChange={(e) => handleStudentChange('subjectsOfInterest', e.target.value)} />
                                <p className="text-xs text-gray-500 mt-1">Separate multiple subjects with commas</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Availability Notes</label>
                                <textarea rows={3} className="input-field" placeholder="Share general times or constraints (e.g., Weekdays after 5pm)" value={studentForm.availabilityNotes} onChange={(e) => handleStudentChange('availabilityNotes', e.target.value)} />
                            </div>
                        </div>
                    </section>

                    {/* Emergency Contact */}
                    <section>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input type="text" className="input-field" value={studentForm.emergencyName} onChange={(e) => handleStudentChange('emergencyName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input type="text" className="input-field" value={studentForm.emergencyPhone} onChange={(e) => handleStudentChange('emergencyPhone', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" className="input-field" value={studentForm.emergencyEmail} onChange={(e) => handleStudentChange('emergencyEmail', e.target.value)} />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end pt-2">
                        {saveStatus === 'success' && (
                            <div className="mr-4 px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm">✓ Saved</div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="mr-4 px-3 py-2 bg-red-100 text-red-800 rounded-md text-sm">✗ Failed to save</div>
                        )}
                        <button onClick={handleSave} disabled={loading} className={`btn-primary flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Save className="h-4 w-4" />
                            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;