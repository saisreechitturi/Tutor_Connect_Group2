import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, MapPin, Star, Plus, Video, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sessionService, reviewService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import ReviewSessionModal from '../modals/ReviewSessionModal';

const MySessions = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewSession, setReviewSession] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [completingSession, setCompletingSession] = useState(null);
    const [sessionReviews, setSessionReviews] = useState({});

    // Helper function to check if session is finished based on end time
    const isSessionFinished = (session) => {
        if (session.status === 'completed' || session.status === 'cancelled') {
            return true;
        }

        const now = new Date();
        const sessionEnd = new Date(session.scheduledEnd || session.scheduled_end);
        return now > sessionEnd;
    };

    // Helper function to determine actual session status
    const getActualStatus = (session) => {
        if (session.status === 'cancelled') return 'cancelled';
        if (session.status === 'completed') return 'completed';

        // Check if session should be marked as finished based on end time
        if (isSessionFinished(session)) {
            return 'finished'; // This means the session time has passed but wasn't marked complete
        }

        return session.status;
    };

    // Function to fetch reviews for sessions
    const fetchSessionReviews = async (sessions) => {
        const reviews = {};

        // Only fetch reviews for completed/finished sessions where user is a student
        const completedSessions = sessions.filter(session =>
            (session.actualStatus === 'completed' || session.actualStatus === 'finished') &&
            user.role === 'student'
        );

        for (const session of completedSessions) {
            try {
                const response = await reviewService.getBySession(session.id);
                console.log(`Reviews for session ${session.id}:`, response);

                // Handle different response formats
                const reviewsArray = response.reviews || response || [];

                // Find review created by current user (student)
                const userReview = reviewsArray.find(review => {
                    // Check if this review was created by the current user
                    const isStudentReview = review.reviewerType === 'student' || review.reviewer_type === 'student';
                    const isCurrentUserReview = review.reviewerId === user.id ||
                        review.reviewer_id === user.id ||
                        (review.student_id && review.student_id === user.id);
                    return isStudentReview && isCurrentUserReview;
                });

                if (userReview) {
                    console.log(`Found user review for session ${session.id}:`, userReview);
                    reviews[session.id] = userReview;
                }
            } catch (error) {
                console.warn(`Failed to fetch review for session ${session.id}:`, error);
            }
        }

        console.log('All session reviews:', reviews);
        setSessionReviews(reviews);
    };

    // Helper function to check if user can leave a review for a session
    const canLeaveReview = (session) => {
        // User must be a student
        if (user.role !== 'student') return false;

        // Session must be completed or finished
        if (session.actualStatus !== 'completed' && session.actualStatus !== 'finished') return false;

        // User must not have already left a review
        if (sessionReviews[session.id]) return false;

        // Session must not already have a rating (legacy check)
        if (session.rating) return false;

        return true;
    };

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                setError(null);

                // Try to get real sessions first, fallback to mock data for testing
                let sessionsData;
                try {
                    sessionsData = await sessionService.getSessions();
                } catch (apiError) {
                    console.warn('API not available, using mock data:', apiError);
                    // Mock session data for testing
                    sessionsData = [
                        {
                            id: 1,
                            title: 'Physics Tutoring',
                            subject: 'Physics',
                            description: 'Quantum mechanics and wave-particle duality',
                            scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                            scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1hr
                            sessionType: 'online',
                            status: 'scheduled',
                            tutor: { id: 1, name: 'Emily Johnson' },
                            student: { id: 2, name: 'Alex Thompson' },
                            meetingLink: 'https://zoom.us/j/123456789'
                        },
                        {
                            id: 2,
                            title: 'Mathematics Session',
                            subject: 'Mathematics',
                            description: 'Calculus and derivatives review',
                            scheduledStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                            scheduledEnd: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago  
                            sessionType: 'in_person',
                            status: 'scheduled', // This will be marked as "finished" by our logic
                            tutor: { id: 2, name: 'Michael Davis' },
                            student: { id: 2, name: 'Alex Thompson' },
                            sessionNotes: 'Great progress on understanding derivatives'
                        },
                        {
                            id: 3,
                            title: 'Chemistry Lab Help',
                            subject: 'Chemistry',
                            description: 'Organic chemistry reactions',
                            scheduledStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
                            scheduledEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // Last week + 1.5hr
                            sessionType: 'online',
                            status: 'completed',
                            tutor: { id: 3, name: 'Sarah Wilson' },
                            student: { id: 2, name: 'Alex Thompson' },
                            rating: 5,
                            sessionNotes: 'Excellent session, student grasped complex concepts well'
                        },
                        {
                            id: 4,
                            title: 'Biology Study Session',
                            subject: 'Biology',
                            description: 'Cell biology and genetics',
                            scheduledStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                            scheduledEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 3 days ago + 1hr
                            sessionType: 'online',
                            status: 'cancelled',
                            tutor: { id: 4, name: 'David Brown' },
                            student: { id: 2, name: 'Alex Thompson' }
                        }
                    ];
                }

                // Process sessions to determine actual status based on timing
                const processedSessions = (sessionsData || []).map(session => ({
                    ...session,
                    actualStatus: getActualStatus(session),
                    isFinished: isSessionFinished(session)
                }));

                setSessions(processedSessions);

                // Fetch reviews for completed sessions
                await fetchSessionReviews(processedSessions);
            } catch (err) {
                console.error('Error fetching sessions:', err);
                setError('Failed to load sessions. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchSessions();
        }
    }, [user?.id, user?.role]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
                    <h3 className="font-medium">Error loading sessions</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    // Filter sessions based on actual status
    const filteredSessions = sessions.filter(session => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return session.actualStatus === 'scheduled';
        if (filter === 'completed') return session.actualStatus === 'completed' || session.actualStatus === 'finished';
        return session.actualStatus === filter;
    });

    const getStatusColor = (actualStatus) => {
        switch (actualStatus) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'finished':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'in_progress':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (actualStatus) => {
        switch (actualStatus) {
            case 'scheduled':
                return 'Scheduled';
            case 'completed':
                return 'Completed';
            case 'finished':
                return 'Needs Review';
            case 'cancelled':
                return 'Cancelled';
            case 'in_progress':
                return 'In Progress';
            default:
                return 'Unknown';
        }
    };

    const getStatusCounts = () => {
        return {
            all: sessions.length,
            upcoming: sessions.filter(s => s.actualStatus === 'scheduled').length,
            completed: sessions.filter(s => s.actualStatus === 'completed' || s.actualStatus === 'finished').length,
            cancelled: sessions.filter(s => s.actualStatus === 'cancelled').length
        };
    };

    const statusCounts = getStatusCounts();

    // Handler functions
    const handleCancelSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to cancel this session?')) {
            return;
        }

        try {
            await sessionService.cancelSession(sessionId);
            // Update local state
            setSessions(prev => prev.map(s =>
                s.id === sessionId
                    ? { ...s, status: 'cancelled', actualStatus: 'cancelled' }
                    : s
            ));
        } catch (error) {
            console.error('Failed to cancel session:', error);
            alert('Failed to cancel session. Please try again.');
        }
    };

    // Handle marking session as completed
    const handleMarkComplete = async (sessionId) => {
        try {
            setCompletingSession(sessionId);
            await sessionService.updateSession(sessionId, { status: 'completed' });

            // Show success message
            try {
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: { type: 'success', title: 'Session marked as completed' }
                }));
            } catch { }

            // Update session in local state
            setSessions(prev => prev.map(session =>
                session.id === sessionId
                    ? { ...session, status: 'completed', actualStatus: 'completed' }
                    : session
            ));
        } catch (error) {
            console.error('Error marking session as complete:', error);
            try {
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: { type: 'error', title: 'Failed to mark session as completed' }
                }));
            } catch { }
        } finally {
            setCompletingSession(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
                            My Sessions
                        </h1>
                        {user.role === 'student' && (
                            <div className="flex items-center">
                                <button
                                    onClick={() => navigate('/student/tutors')}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Find Tutors
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { key: 'all', label: 'Total Sessions', count: statusCounts.all, color: 'bg-gray-50 border-gray-200' },
                            { key: 'upcoming', label: 'Scheduled', count: statusCounts.upcoming, color: 'bg-blue-50 border-blue-200' },
                            { key: 'completed', label: 'Completed', count: statusCounts.completed, color: 'bg-green-50 border-green-200' },
                            { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, color: 'bg-red-50 border-red-200' }
                        ].map((stat) => (
                            <button
                                key={stat.key}
                                onClick={() => setFilter(stat.key)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${filter === stat.key ? 'ring-2 ring-primary-500 ' + stat.color : stat.color
                                    }`}
                            >
                                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-4 mb-6 border-b border-gray-200">
                        {[
                            { key: 'all', label: 'All Sessions' },
                            { key: 'upcoming', label: 'Upcoming' },
                            { key: 'completed', label: 'Completed' },
                            { key: 'cancelled', label: 'Cancelled' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${filter === tab.key
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                                {statusCounts[tab.key] > 0 && (
                                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                                        {statusCounts[tab.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Sessions List */}
                    <div className="space-y-4">
                        {filteredSessions.length > 0 ? (
                            filteredSessions.map((session) => {
                                const sessionDate = new Date(session.scheduledStart || session.scheduled_start);
                                const sessionEndDate = new Date(session.scheduledEnd || session.scheduled_end);
                                const duration = Math.round((sessionEndDate - sessionDate) / (1000 * 60)); // duration in minutes

                                return (
                                    <div key={session.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {session.title || session.subject || 'Tutoring Session'}
                                                        </h3>
                                                        {session.subject && session.title && session.title !== session.subject && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {session.subject}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(session.actualStatus)}`}>
                                                        {getStatusLabel(session.actualStatus)}
                                                    </span>
                                                </div>

                                                {/* Tutor/Student Info */}
                                                <div className="mb-3">
                                                    {user.role === 'student' ? (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <User className="h-4 w-4 mr-2" />
                                                            <span>Tutor: {session.tutor?.name || 'Unknown'}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <User className="h-4 w-4 mr-2" />
                                                            <span>Student: {session.student?.name || 'Unknown'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        <span>{sessionDate.toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        <span>
                                                            {sessionDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })} ({duration} min)
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {session.sessionType === 'online' || session.session_type === 'online' ? (
                                                            <>
                                                                <Video className="h-4 w-4 mr-2" />
                                                                <span>Online</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MapPin className="h-4 w-4 mr-2" />
                                                                <span>In-person</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Session Description */}
                                                {session.description && (
                                                    <div className="mt-3 p-3 bg-white rounded border">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Description:</strong> {session.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Session Notes for completed sessions */}
                                                {session.sessionNotes && (session.actualStatus === 'completed' || session.actualStatus === 'finished') && (
                                                    <div className="mt-3 p-3 bg-white rounded border">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Session Notes:</strong> {session.sessionNotes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Show warning if session time has passed but not completed */}
                                                {session.actualStatus === 'finished' && (
                                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                                        <div className="flex items-center">
                                                            <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                                                            <p className="text-sm text-yellow-800">
                                                                This session has ended. Please leave a review to help improve the tutoring experience.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Display rating if session is rated */}
                                                {(session.actualStatus === 'completed' || session.actualStatus === 'finished') && session.rating && (
                                                    <div className="mt-3 flex items-center">
                                                        <span className="text-sm text-gray-600 mr-2">Your Rating:</span>
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-4 w-4 ${i < session.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                                        }`}
                                                                />
                                                            ))}
                                                            <span className="ml-2 text-sm text-gray-600">({session.rating}/5)</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ml-4 flex flex-col space-y-2">
                                                {/* Upcoming session actions */}
                                                {session.actualStatus === 'scheduled' && (
                                                    <>
                                                        {session.meetingLink ? (
                                                            <button
                                                                onClick={() => window.open(session.meetingLink, '_blank')}
                                                                className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors"
                                                            >
                                                                Join Session
                                                            </button>
                                                        ) : (
                                                            <button className="bg-gray-400 text-white px-4 py-2 rounded text-sm cursor-not-allowed">
                                                                Join Session
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleCancelSession(session.id)}
                                                            className="border border-red-300 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}

                                                {/* Finished session actions - needs review */}
                                                {session.actualStatus === 'finished' && user.role === 'student' && (
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                                                            onClick={() => handleMarkComplete(session.id)}
                                                            disabled={completingSession === session.id}
                                                        >
                                                            {completingSession === session.id ? 'Marking Complete...' : 'Mark as Complete'}
                                                        </button>
                                                        {sessionReviews[session.id] ? (
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="flex items-center">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`h-4 w-4 ${i < sessionReviews[session.id].rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-green-800">Your Review</span>
                                                                </div>
                                                                {sessionReviews[session.id].comment && (
                                                                    <p className="text-sm text-green-700 italic">"{sessionReviews[session.id].comment}"</p>
                                                                )}
                                                                {(sessionReviews[session.id].wouldRecommend !== null || sessionReviews[session.id].would_recommend !== null) && (
                                                                    <p className="text-xs text-green-600 mt-1">
                                                                        {(sessionReviews[session.id].wouldRecommend ?? sessionReviews[session.id].would_recommend) ? '✓ Would recommend' : '✗ Would not recommend'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : canLeaveReview(session) && (
                                                            <button
                                                                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                                                                onClick={() => {
                                                                    if (!sessionReviews[session.id]) {
                                                                        setReviewSession(session);
                                                                        setShowReviewModal(true);
                                                                    }
                                                                }}
                                                            >
                                                                Leave Review
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Completed session actions */}
                                                {session.actualStatus === 'completed' && user.role === 'student' && (
                                                    sessionReviews[session.id] ? (
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex items-center">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={`h-4 w-4 ${i < sessionReviews[session.id].rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm font-medium text-green-800">Your Review</span>
                                                            </div>
                                                            {sessionReviews[session.id].comment && (
                                                                <p className="text-sm text-green-700 italic">"{sessionReviews[session.id].comment}"</p>
                                                            )}
                                                            {(sessionReviews[session.id].wouldRecommend !== null || sessionReviews[session.id].would_recommend !== null) && (
                                                                <p className="text-xs text-green-600 mt-1">
                                                                    {(sessionReviews[session.id].wouldRecommend ?? sessionReviews[session.id].would_recommend) ? '✓ Would recommend' : '✗ Would not recommend'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : canLeaveReview(session) && (
                                                        <button
                                                            className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                                                            onClick={() => {
                                                                if (!sessionReviews[session.id]) {
                                                                    setReviewSession(session);
                                                                    setShowReviewModal(true);
                                                                }
                                                            }}
                                                        >
                                                            Leave Review
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No {filter !== 'all' ? (filter === 'upcoming' ? 'upcoming' : filter) : ''} sessions found
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {filter === 'upcoming' && user.role === 'student' && "You don't have any upcoming sessions. Book a session with a tutor to get started!"}
                                    {filter === 'completed' && "No completed sessions yet. Your finished sessions will appear here."}
                                    {filter === 'cancelled' && "No cancelled sessions."}
                                    {filter === 'all' && user.role === 'student' && "You haven't booked any sessions yet. Start by finding a tutor!"}
                                    {filter === 'all' && user.role === 'tutor' && "You don't have any sessions scheduled yet. Students will book sessions with you."}
                                </p>
                                {filter !== 'cancelled' && filter !== 'completed' && (
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        {user.role === 'student' ? 'Find Tutors' : 'Manage Availability'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal (placeholder) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">
                            {user.role === 'student' ? 'Book a Session' : 'Set Availability'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            This feature will be implemented in the next phase of development.
                        </p>
                        <button
                            onClick={() => setShowBookingModal(false)}
                            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && reviewSession && (
                <ReviewSessionModal
                    isOpen={showReviewModal}
                    onClose={() => { setShowReviewModal(false); setReviewSession(null); }}
                    session={reviewSession}
                    onSubmitted={async ({ rating, comment, wouldRecommend }) => {
                        // Update the session with review data and mark as completed
                        setSessions(prev => prev.map(s =>
                            s.id === reviewSession.id
                                ? {
                                    ...s,
                                    rating,
                                    comment,
                                    status: 'completed',
                                    actualStatus: 'completed'
                                }
                                : s
                        ));

                        // Add the new review to sessionReviews immediately for quick UI update
                        setSessionReviews(prev => ({
                            ...prev,
                            [reviewSession.id]: {
                                rating,
                                comment,
                                wouldRecommend: wouldRecommend,
                                would_recommend: wouldRecommend,
                                sessionId: reviewSession.id,
                                session_id: reviewSession.id,
                                reviewerType: 'student',
                                reviewer_type: 'student',
                                reviewerId: user.id,
                                reviewer_id: user.id
                            }
                        }));

                        // Close modal first
                        setShowReviewModal(false);
                        setReviewSession(null);

                        // Then refresh review data from server to ensure consistency
                        setTimeout(() => {
                            fetchSessionReviews(sessions.filter(s => s.id === reviewSession.id));
                        }, 1000);
                    }}
                />
            )}
        </div>
    );
};

export default MySessions;