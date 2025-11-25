import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, DollarSign, Filter, BookOpen } from 'lucide-react';
import { tutorService } from '../../services';
import BookSessionModal from '../modals/BookSessionModal';

const TutorSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        subject: '',
        maxRate: '',
        rating: '',
        availability: ''
    });
    const [sortBy, setSortBy] = useState('rating');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                setLoading(true);
                setError(null);
                const tutorsData = await tutorService.getTutors();
                setTutors(tutorsData || []);
            } catch (err) {
                console.error('Error fetching tutors:', err);
                setError('Failed to load tutors. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-red-600">
                    <h3 className="font-medium">Error loading tutors</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const filteredTutors = tutors.filter(tutor => {
        const matchesSearch = !searchTerm ||
            (tutor.subjects && tutor.subjects.some(subject =>
                typeof subject === 'object' ? subject.name.toLowerCase().includes(searchTerm.toLowerCase()) : subject.toLowerCase().includes(searchTerm.toLowerCase())
            )) ||
            (tutor.firstName && tutor.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (tutor.lastName && tutor.lastName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSubject = !filters.subject ||
            (tutor.subjects && tutor.subjects.some(subject =>
                typeof subject === 'object' ? subject.name.toLowerCase().includes(filters.subject.toLowerCase()) : subject.toLowerCase().includes(filters.subject.toLowerCase())
            ));

        const matchesRate = !filters.maxRate || tutor.hourlyRate <= parseInt(filters.maxRate);

        const matchesRating = !filters.rating || tutor.rating >= parseFloat(filters.rating);

        return matchesSearch && matchesSubject && matchesRate && matchesRating;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            case 'price': return (a.hourlyRate || 0) - (b.hourlyRate || 0);
            case 'experience': return (b.totalSessions || 0) - (a.totalSessions || 0);
            default: return 0;
        }
    });

    const handleBookSession = (tutor) => {
        setSelectedTutor(tutor);
        setShowBookingModal(true);
    };

    const handleSessionBooked = (newSession) => {
        // You can add any additional logic here, like showing a success message
        console.log('Session booked successfully:', newSession);
        setShowBookingModal(false);
        setSelectedTutor(null);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                    }`}
            />
        ));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Tutors</h1>
                <p className="text-gray-600 mt-1">Discover expert tutors for your learning needs</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                    {/* Search Bar with Filter Button */}
                    <div className="flex space-x-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by subject, tutor name..."
                                className="input-field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                setFilters({ subject: '', maxRate: '', rating: '', availability: '' });
                                setSearchTerm('');
                            }}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Reset all filters"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Reset</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. JavaScript, Calculus"
                                className="input-field"
                                value={filters.subject}
                                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Rate ($/hour)
                            </label>
                            <input
                                type="number"
                                placeholder="Max budget"
                                className="input-field"
                                value={filters.maxRate}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Rating
                            </label>
                            <select
                                className="input-field"
                                value={filters.rating}
                                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                            >
                                <option value="">Any Rating</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4.8">4.8+ Stars</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                className="input-field"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="rating">Highest Rated</option>
                                <option value="price">Lowest Price</option>
                                <option value="experience">Most Experienced</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="text-sm text-gray-600 mb-4">
                Found {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''}
            </div>

            {/* Tutor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTutors.map((tutor) => (
                    <div key={tutor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        {/* Tutor Header */}
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {tutor.profileImageUrl ? (
                                    <img
                                        src={tutor.profileImageUrl}
                                        alt={`${tutor.firstName} ${tutor.lastName}`}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{tutor.firstName?.[0]}{tutor.lastName?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                    {tutor.firstName} {tutor.lastName}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex items-center">
                                        {renderStars(tutor.rating || 0)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {tutor.rating || 0} ({tutor.totalSessions || 0} sessions)
                                    </span>
                                </div>
                                {tutor.verified && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {tutor.bio || 'No bio available.'}
                        </p>

                        {/* Subjects */}
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Subjects</h4>
                            <div className="flex flex-wrap gap-1">
                                {(tutor.subjects || []).slice(0, 3).map((subject, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700"
                                    >
                                        {typeof subject === 'object' ? subject.name : subject}
                                    </span>
                                ))}
                                {(tutor.subjects || []).length > 3 && (
                                    <span className="text-xs text-gray-500">
                                        +{tutor.subjects.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="flex items-center text-gray-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-medium">${tutor.hourlyRate || 0}/hour</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{tutor.responseTime || 'N/A'}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <BookOpen className="h-4 w-4 mr-1" />
                                <span>{tutor.totalSessions || 0} sessions</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{tutor.location || 'Not specified'}</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => handleBookSession(tutor)}
                            className="w-full btn-primary"
                        >
                            Book Session
                        </button>
                    </div>
                ))}
            </div>

            {filteredTutors.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                    <p className="text-gray-600">
                        Try adjusting your search criteria or browse all available tutors.
                    </p>
                </div>
            )}

            {/* Book Session Modal */}
            <BookSessionModal
                isOpen={showBookingModal}
                onClose={() => {
                    setShowBookingModal(false);
                    setSelectedTutor(null);
                }}
                onSessionBooked={handleSessionBooked}
                selectedTutor={selectedTutor}
            />
        </div>
    );
};

export default TutorSearch;