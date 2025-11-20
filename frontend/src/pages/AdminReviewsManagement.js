import React, { useState, useEffect } from 'react';
import { Search, Star, Eye, Trash2, AlertTriangle, CheckCircle, XCircle, Calendar, User, X } from 'lucide-react';
import { adminService } from '../services';

const AdminReviewsManagement = () => {
    const [reviews, setReviews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        rating: '',
        reviewerType: '',
        dateRange: 'all'
    });
    const [selectedReview, setSelectedReview] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [filters, searchTerm]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryFilters = {
                ...filters,
                search: searchTerm || undefined
            };

            const response = await adminService.getAllReviews(queryFilters);
            const reviewsData = response.reviews || [];
            setReviews(reviewsData);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews. Please try again.');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };




    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                await adminService.deleteReview(reviewId);
                setReviews(prev => prev.filter(review => review.id !== reviewId));
                console.log(`Deleted review ${reviewId}`);
            } catch (err) {
                console.error('Error deleting review:', err);
                alert('Failed to delete review. Please try again.');
            }
        }
    };

    const handleViewDetails = (review) => {
        setSelectedReview(review);
        setShowDetailModal(true);
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-green-600';
        if (rating >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getUserInitial = (firstName, lastName) => {
        if (firstName) {
            return firstName.charAt(0).toUpperCase();
        }
        if (lastName) {
            return lastName.charAt(0).toUpperCase();
        }
        return 'U'; // Default for 'User'
    };

    const getAvatarColor = (name) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const charCode = name ? name.charCodeAt(0) : 0;
        return colors[charCode % colors.length];
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold">Reviews Management</h1>
                    <p className="mt-2 text-purple-100">Monitor and manage platform reviews and feedback.</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold">Reviews Management</h1>
                <p className="mt-2 text-purple-100">Monitor and manage platform reviews and feedback.</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search reviews, users, or subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <select
                            value={filters.rating}
                            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        <select
                            value={filters.reviewerType}
                            onChange={(e) => setFilters(prev => ({ ...prev, reviewerType: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="student">Student Reviews</option>
                            <option value="tutor">Tutor Reviews</option>
                        </select>

                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="quarter">Last 3 Months</option>
                        </select>

                        <button
                            onClick={fetchReviews}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
                    <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                    <p className="text-2xl font-bold text-gray-900">
                        {reviews.length > 0
                            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                            : '0.0'
                        }
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-500">Positive Reviews</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {reviews.filter(r => r.rating >= 4).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-500">Low Ratings</h3>
                    <p className="text-2xl font-bold text-red-600">
                        {reviews.filter(r => r.rating <= 2).length}
                    </p>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Reviews ({reviews.length})
                    </h2>
                </div>

                {reviews.length === 0 ? (
                    <div className="p-8 text-center">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                        <p className="text-gray-500">
                            {searchTerm || Object.values(filters).some(f => f)
                                ? 'Try adjusting your search or filters.'
                                : 'No reviews have been submitted yet.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(review.reviewer.firstName || review.reviewer.lastName || review.reviewer.email)}`}>
                                            {getUserInitial(review.reviewer.firstName, review.reviewer.lastName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center">
                                                    {renderStars(review.rating)}
                                                </div>
                                                <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                                                    {review.rating}/5
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.reviewerType === 'student'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {review.reviewerType}
                                                </span>
                                                {review.wouldRecommend ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" title="Would recommend" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500" title="Would not recommend" />
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-900 mb-1">
                                                <span className="font-medium">
                                                    {review.reviewer.firstName} {review.reviewer.lastName}
                                                </span>
                                                {' → '}
                                                <span className="font-medium">
                                                    {review.reviewee.firstName} {review.reviewee.lastName}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 mb-2 line-clamp-2">
                                                {review.comment || 'No comment provided'}
                                            </p>

                                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {formatDate(review.createdAt)}
                                                </span>
                                                {review.session && (
                                                    <span>
                                                        Subject: {review.session.subject}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => handleViewDetails(review)}
                                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReview(review.id)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Review"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Detail Modal */}
            {showDetailModal && selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Rating and Recommendation */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center">
                                            {renderStars(selectedReview.rating)}
                                        </div>
                                        <span className={`text-xl font-bold ${getRatingColor(selectedReview.rating)}`}>
                                            {selectedReview.rating}/5
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {selectedReview.wouldRecommend ? (
                                            <div className="flex items-center text-green-600">
                                                <CheckCircle className="h-5 w-5 mr-1" />
                                                <span className="font-medium">Recommends</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-red-600">
                                                <XCircle className="h-5 w-5 mr-1" />
                                                <span className="font-medium">Does not recommend</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reviewer and Reviewee Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Reviewer</h4>
                                        <div className="flex items-center space-x-3">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(selectedReview.reviewer.firstName || selectedReview.reviewer.lastName || selectedReview.reviewer.email)}`}>
                                                {getUserInitial(selectedReview.reviewer.firstName, selectedReview.reviewer.lastName)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {selectedReview.reviewer.firstName} {selectedReview.reviewer.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">{selectedReview.reviewer.email}</p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedReview.reviewerType === 'student'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {selectedReview.reviewerType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Reviewee</h4>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {selectedReview.reviewee.firstName} {selectedReview.reviewee.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">{selectedReview.reviewee.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Details */}
                                {selectedReview.session && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Session Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Subject:</span>
                                                <p className="font-medium">{selectedReview.session.subject}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Duration:</span>
                                                <p className="font-medium">{selectedReview.session.duration} minutes</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Date:</span>
                                                <p className="font-medium">{selectedReview.session.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Comment */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Comment</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {selectedReview.comment || 'No comment provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                        <div>
                                            <span>Review ID:</span>
                                            <p className="font-mono text-xs">{selectedReview.id}</p>
                                        </div>
                                        <div>
                                            <span>Submitted:</span>
                                            <p>{formatDate(selectedReview.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between pt-6 border-t mt-6">
                                <button
                                    onClick={() => handleDeleteReview(selectedReview.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Review
                                </button>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviewsManagement;