import React, { useState, useEffect, useCallback } from 'react';
import { Star, MapPin, Clock, DollarSign, Filter, BookOpen, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tutorService, subjectsService } from '../services';
import BookSessionModal from '../components/modals/BookSessionModal';

const BrowseTutors = () => {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('price_low');
    const [subjects, setSubjects] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);

    // Initial load: fetch subjects once
    useEffect(() => {
        fetchSubjects();
    }, []);

    // Build the fetchTutors function with stable deps so we don't need to disable ESLint rules
    const fetchTutors = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await tutorService.getTutors({
                subject: selectedSubject || undefined,
                ...(minPrice && { minRate: parseFloat(minPrice) }),
                ...(maxPrice && { maxRate: parseFloat(maxPrice) }),
                minRating: undefined,
                search: searchTerm || undefined,
            });
            setTutors(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch tutors');
            console.error('Error fetching tutors:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedSubject, minPrice, maxPrice, searchTerm]);

    // Refetch tutors when filters change (debounced search could be added later)
    useEffect(() => {
        fetchTutors();
    }, [fetchTutors, selectedSubject, minPrice, maxPrice, sortBy]);



    const fetchSubjects = async () => {
        try {
            const res = await subjectsService.list({ active: true, limit: 100 });
            const names = (res.subjects || []).map(s => s.name).sort();
            setSubjects(names);
        } catch (err) {
            console.warn('Failed to load subjects; falling back to static list.', err);
            setSubjects(['Mathematics', 'Physics', 'Spanish', 'Chemistry', 'Biology']);
        }
    };

    const handleBookSession = (tutor) => {
        setSelectedTutor(tutor);
        setShowBookingModal(true);
    };

    const handleSessionBooked = (newSession) => {
        console.log('Session booked successfully:', newSession);
        setShowBookingModal(false);
        setSelectedTutor(null);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading tutors from database...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading tutors: {error}</p>
                    <button
                        onClick={fetchTutors}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // subjects are loaded from API into state

    // Filter tutors based on search criteria
    const filteredTutors = tutors.filter(tutor => {
        const matchesSearch = !searchTerm ||
            tutor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tutor.bio && tutor.bio.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesPrice = (!minPrice || tutor.hourlyRate >= parseFloat(minPrice)) &&
            (!maxPrice || tutor.hourlyRate <= parseFloat(maxPrice));

        return matchesSearch && matchesPrice;
    });

    // Sort tutors
    const sortedTutors = [...filteredTutors].sort((a, b) => {
        switch (sortBy) {
            case 'price_low':
                return a.hourlyRate - b.hourlyRate;
            case 'price_high':
                return b.hourlyRate - a.hourlyRate;
            case 'rating':
                return b.rating - a.rating;
            default:
                return a.hourlyRate - b.hourlyRate;
        }
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Tutor</h1>
                        <p className="text-xl text-primary-100">
                            Browse our network of expert tutors and find the perfect match for your learning needs
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-2">
                            <input
                                type="text"
                                placeholder="Search by subject, tutor name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Subject Filter */}
                        <div>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range Filter */}
                        <div className="flex space-x-2">
                            <input
                                type="number"
                                placeholder="Min $"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="0"
                                step="1"
                            />
                            <input
                                type="number"
                                placeholder="Max $"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="0"
                                step="1"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {/* Ranking removed per scope simplification */}
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>

                        {/* Filter Reset Button */}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedSubject('');
                                setMinPrice('');
                                setMaxPrice('');
                                setSortBy('price_low');
                            }}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Reset all filters"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Reset
                        </button>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Showing {sortedTutors.length} of {tutors.length} tutors
                    </div>
                </div>

                {/* Tutors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedTutors.map((tutor) => (
                        <div key={tutor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            {/* Tutor Header */}
                            <div className="flex items-start space-x-4 mb-4">
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
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {tutor.firstName} {tutor.lastName}
                                    </h3>
                                    <div className="flex items-center mt-1">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.floor(tutor.rating)
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {tutor.rating} ({tutor.totalSessions} sessions)
                                        </span>
                                        {tutor.rating >= 4.5 && (
                                            <Award className="h-4 w-4 ml-2 text-yellow-500" title="Top-rated tutor" />
                                        )}
                                    </div>
                                    {tutor.location && (
                                        <div className="flex items-center mt-1 text-sm text-gray-500">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            <span>{tutor.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subjects */}
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {tutor.subjects.slice(0, 3).map((subject) => (
                                        <span
                                            key={subject.id}
                                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                        >
                                            {subject.name}
                                        </span>
                                    ))}
                                    {tutor.subjects.length > 3 && (
                                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                            +{tutor.subjects.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                                <div>
                                    <div className="flex items-center justify-center mb-1">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">${tutor.hourlyRate}</p>
                                    <p className="text-xs text-gray-500">per hour</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center mb-1">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">{tutor.totalSessions}</p>
                                    <p className="text-xs text-gray-500">sessions</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center mb-1">
                                        <Clock className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">{tutor.experienceYears}y</p>
                                    <p className="text-xs text-gray-500">experience</p>
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{tutor.isAvailable ? 'Available now' : 'Busy'}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleBookSession(tutor)}
                                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-center block font-medium"
                                >
                                    Book Session
                                </button>
                                <Link
                                    to={`/tutors/${tutor.id}`}
                                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center block"
                                >
                                    View Profile
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {sortedTutors.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                        <p className="text-gray-500 mb-4">Try adjusting your search criteria to find more tutors.</p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedSubject('');
                                setMinPrice('');
                                setMaxPrice('');
                                setSortBy('price_low');
                            }}
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Call to Action */}
                <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
                    <p className="text-primary-100 mb-6">
                        Join thousands of students who have found their perfect tutor on TutorConnect
                    </p>
                    <div className="space-x-4">
                        <Link
                            to="/signup"
                            className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium inline-block"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/login"
                            className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors font-medium inline-block"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>

            {/* Book Session Modal */}
            {showBookingModal && (
                <BookSessionModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    onSessionBooked={handleSessionBooked}
                    selectedTutor={selectedTutor}
                />
            )}
        </div>
    );
};

export default BrowseTutors;