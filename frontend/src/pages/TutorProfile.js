import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, DollarSign, BookOpen, Clock, Users, ArrowLeft } from 'lucide-react';
import { tutorService } from '../services';
import BookSessionModal from '../components/modals/BookSessionModal';

const TutorProfile = () => {
    const { id } = useParams();
    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        const loadTutor = async () => {
            try {
                setLoading(true);
                const data = await tutorService.getTutorById(id);
                setTutor(data);
            } catch (err) {
                console.error('Failed to load tutor', err);
                setError(err.message || 'Failed to load tutor');
            } finally {
                setLoading(false);
            }
        };
        loadTutor();
    }, [id]);

    const handleSessionBooked = () => {
        setShowBookingModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tutor profile...</p>
                </div>
            </div>
        );
    }

    if (error || !tutor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Tutor not found'}</p>
                    <Link to="/browse-tutors" className="inline-flex items-center text-primary-600 hover:underline">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Browse
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link to="/browse-tutors" className="inline-flex items-center text-primary-600 hover:underline">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Browse
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Header */}
                    <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                            {tutor.profileImageUrl ? (
                                <img src={tutor.profileImageUrl} alt={`${tutor.firstName} ${tutor.lastName}`} className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <span>{tutor.firstName?.[0]}{tutor.lastName?.[0]}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {tutor.firstName} {tutor.lastName}
                            </h1>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(tutor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <span className="ml-2">{tutor.rating} rating</span>
                                <span className="mx-2">•</span>
                                <span>{tutor.totalSessions} sessions</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-500 text-sm">Hourly rate</div>
                            <div className="text-2xl font-semibold text-gray-900">${tutor.hourlyRate}</div>
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-primary-600" /> Subjects
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {tutor.subjects?.length ? (
                                tutor.subjects.map((subject) => (
                                    <span key={subject.id || subject.name} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {subject.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No subjects listed</span>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                        <p className="text-gray-700 whitespace-pre-line">{tutor.bio || 'This tutor has not added a bio yet.'}</p>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            <div className="text-xl font-semibold text-gray-900">${tutor.hourlyRate}</div>
                            <div className="text-xs text-gray-500">per hour</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                            <div className="text-xl font-semibold text-gray-900">{tutor.totalSessions}</div>
                            <div className="text-xs text-gray-500">total sessions</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                            <div className="text-xl font-semibold text-gray-900">{tutor.experienceYears || 0}y</div>
                            <div className="text-xs text-gray-500">experience</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setShowBookingModal(true)}
                            className="btn-primary flex-1"
                        >
                            Book Session
                        </button>
                        <Link to="/browse-tutors" className="btn-secondary flex-1 text-center">Continue Browsing</Link>
                    </div>
                </div>
            </div>

            {/* Book Session Modal */}
            {showBookingModal && (
                <BookSessionModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    onSessionBooked={handleSessionBooked}
                    selectedTutor={tutor}
                />
            )}
        </div>
    );
};

export default TutorProfile;
