import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, DollarSign, BookOpen, Clock, Users, ArrowLeft, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { tutorService, reviewService } from '../services';
import BookSessionModal from '../components/modals/BookSessionModal';

const TutorProfile = () => {
    const { id } = useParams();
    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState(null);
    const [reviewsRetryTrigger, setReviewsRetryTrigger] = useState(0);
    const [reviewsPagination, setReviewsPagination] = useState({
        total: 0,
        limit: 5,
        offset: 0,
        hasMore: false
    });

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

    useEffect(() => {
        const loadReviews = async () => {
            if (!id) return;

            try {
                setReviewsLoading(true);
                setReviewsError(null);
                const data = await reviewService.getByTutor(id, {
                    limit: reviewsPagination.limit,
                    offset: reviewsPagination.offset
                });
                setReviews(data.reviews || []);
                if (data.pagination) {
                    setReviewsPagination(prev => ({
                        ...prev,
                        total: data.pagination.total,
                        hasMore: data.pagination.hasMore
                    }));
                }
            } catch (err) {
                console.error('Failed to load reviews', err);
                setReviewsError(err.message || 'Failed to load reviews');
            } finally {
                setReviewsLoading(false);
            }
        };

        loadReviews();
    }, [id, reviewsPagination.limit, reviewsPagination.offset, reviewsRetryTrigger]);

    const handleRetryReviews = () => {
        setReviewsRetryTrigger(prev => prev + 1);
    };

    const handleNextPage = () => {
        if (reviewsPagination.hasMore) {
            setReviewsPagination(prev => ({
                ...prev,
                offset: prev.offset + prev.limit
            }));
        }
    };

    const handlePrevPage = () => {
        if (reviewsPagination.offset > 0) {
            setReviewsPagination(prev => ({
                ...prev,
                offset: Math.max(0, prev.offset - prev.limit)
            }));
        }
    };

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

                    {/* Reviews Section */}
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                            Student Reviews
                            {reviewsPagination.total > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({reviewsPagination.total} {reviewsPagination.total === 1 ? 'review' : 'reviews'})
                                </span>
                            )}
                        </h2>

                        {/* Loading State */}
                        {reviewsLoading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-3 text-gray-600">Loading reviews...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!reviewsLoading && reviewsError && (
                            <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-600 mb-3">{reviewsError}</p>
                                <button
                                    onClick={handleRetryReviews}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                    aria-label="Retry loading reviews"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">No reviews yet</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Be the first to book a session and leave a review!
                                </p>
                            </div>
                        )}

                        {/* Reviews List */}
                        {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                                    {review.student?.avatar ? (
                                                        <img
                                                            src={review.student.avatar}
                                                            alt={`${review.student.firstName} ${review.student.lastName}`}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {review.student?.firstName?.[0]}
                                                            {review.student?.lastName?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {review.student?.firstName} {review.student?.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                        {review.subjectName && ` • ${review.subjectName}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-700 text-sm mt-2 whitespace-pre-line">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {/* Pagination Controls */}
                                {reviewsPagination.total > reviewsPagination.limit && (
                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            onClick={handlePrevPage}
                                            disabled={reviewsPagination.offset === 0}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Previous page of reviews"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Showing {reviewsPagination.offset + 1} - {Math.min(reviewsPagination.offset + reviewsPagination.limit, reviewsPagination.total)} of {reviewsPagination.total}
                                        </span>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={!reviewsPagination.hasMore}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Next page of reviews"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
