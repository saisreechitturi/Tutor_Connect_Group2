import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, MapPin, Star, Filter, Plus } from 'lucide-react';
import { sessionService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import ReviewSessionModal from '../modals/ReviewSessionModal';

const MySessions = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewSession, setReviewSession] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Utility functions for date/time formatting
    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const formatTimeRange = (startString, endString) => {
        if (!startString || !endString) return 'Invalid Time';
        try {
            const start = new Date(startString);
            const end = new Date(endString);
            const startTime = start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const endTime = end.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `${startTime} - ${endTime}`;
        } catch (error) {
            console.error('Error formatting time range:', error);
            return 'Invalid Time';
        }
    };

    // Session action handlers
    const handleJoinSession = (session) => {
        if (session.sessionType === 'online') {
            if (session.meetingLink) {
                window.open(session.meetingLink, '_blank');
            } else {
                alert('Meeting link will be provided closer to the session time.');
            }
        } else {
            alert(`Session Location: ${session.meetingRoom || 'Location details will be provided by your tutor.'}`);
        }
    };

    const handleCancel = async (session) => {
        if (actionLoading) return;

        const confirmCancel = window.confirm(
            `Are you sure you want to cancel the session "${session.title}"? This action cannot be undone.`
        );

        if (confirmCancel) {
            try {
                setActionLoading(true);

                // Check if user can cancel (tutors can cancel directly, students who booked can cancel)
                if ((user.role === 'tutor' && session.tutor.id === user.id) ||
                    (user.role === 'student' && session.student.id === user.id)) {
                    await sessionService.cancelSession(session.id);

                    // Update the sessions list to reflect the cancellation
                    setSessions(prev => prev.map(s =>
                        s.id === session.id ? { ...s, status: 'cancelled' } : s
                    ));

                    alert('Session cancelled successfully.');
                } else {
                    // For students, show message about contacting tutor
                    alert('Please contact your tutor to cancel this session. Tutors have the ability to manage session status.');
                }
            } catch (error) {
                console.error('Error cancelling session:', error);
                if (error.message?.includes('403') || error.message?.includes('unauthorized')) {
                    alert('You do not have permission to cancel this session. Please contact your tutor.');
                } else {
                    alert('Failed to cancel session. Please try again.');
                }
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleBookAgain = (_session) => {
        if (user.role === 'student') {
            // For now, redirect to browse tutors page
            // In future, could open booking modal with pre-filled tutor data
            window.location.href = '/browse-tutors';
        }
    };

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use the general getSessions method which handles both students and tutors
                const sessionsData = await sessionService.getSessions();
                setSessions(sessionsData);
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

    // Filter sessions based on status
    const filteredSessions = sessions.filter(session => {
        if (filter === 'all') return true;
        return session.status === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusCounts = () => {
        return {
            all: sessions.length,
            scheduled: sessions.filter(s => s.status === 'scheduled').length,
            completed: sessions.filter(s => s.status === 'completed').length,
            cancelled: sessions.filter(s => s.status === 'cancelled').length
        };
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
                            My Sessions
                        </h1>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setFilter('all')}
                                className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Reset filters"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                    {filter === 'all' ? 'All Sessions' : `Filter: ${filter}`}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    if (user.role === 'student') {
                                        window.location.href = '/browse-tutors';
                                    } else {
                                        window.location.href = '/tutor-availability';
                                    }
                                }}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {user.role === 'student' ? 'Book Session' : 'Set Availability'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { key: 'all', label: 'Total Sessions', count: statusCounts.all, color: 'bg-gray-50 border-gray-200' },
                            { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled, color: 'bg-blue-50 border-blue-200' },
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
                            { key: 'scheduled', label: 'Upcoming' },
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
                            filteredSessions.map((session) => (
                                <div key={session.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{session.title || session.subject}</h3>
                                                {session.subject && (
                                                    <p className="text-sm text-gray-600">{session.subject}</p>
                                                )}
                                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                                                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <span>{formatDate(session.scheduledStart)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    <span>{formatTimeRange(session.scheduledStart, session.scheduledEnd)} ({session.durationMinutes} min)</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    <span>
                                                        {session.sessionType === 'online' ? (
                                                            session.meetingLink ? (
                                                                <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center">
                                                                    <span className="mr-1">🔗</span> Join Online Meeting
                                                                </a>
                                                            ) : (
                                                                <span className="text-orange-600">Online (Link will be provided)</span>
                                                            )
                                                        ) : (
                                                            <span className="flex items-center">
                                                                <span className="mr-1">📍</span>
                                                                {session.locationAddress || 'In-person location TBD'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Participant Information */}
                                            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                                                {user.role === 'student' ? (
                                                    session.tutor && session.tutor.name && (
                                                        <div className="flex items-center">
                                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                                                <span className="text-xs font-medium text-blue-600">
                                                                    {session.tutor.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <span>Tutor: {session.tutor.name}</span>
                                                        </div>
                                                    )
                                                ) : (
                                                    session.student && session.student.name && (
                                                        <div className="flex items-center">
                                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                                                <span className="text-xs font-medium text-green-600">
                                                                    {session.student.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <span>Student: {session.student.name}</span>
                                                        </div>
                                                    )
                                                )}
                                                {session.hourlyRate && (
                                                    <div className="flex items-center">
                                                        <span className="font-medium">${session.hourlyRate}/hr</span>
                                                    </div>
                                                )}
                                            </div>

                                            {(session.description || session.sessionNotes) && (
                                                <div className="mt-3 p-3 bg-white rounded border">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Description:</strong> {session.description || session.sessionNotes}
                                                    </p>
                                                </div>
                                            )}

                                            {session.status === 'completed' && session.rating && (
                                                <div className="mt-3 flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">Rating:</span>
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
                                            {session.status === 'scheduled' && (
                                                <>
                                                    {session.sessionType === 'online' && session.meetingLink ? (
                                                        <a
                                                            href={session.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors text-center inline-block"
                                                        >
                                                            Join Session
                                                        </a>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleJoinSession(session)}
                                                            className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors"
                                                            title={session.sessionType === 'online' ? 'Get meeting link information' : 'View session location details'}
                                                        >
                                                            {session.sessionType === 'online' ? 'Get Meeting Link' : 'View Location'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancel(session)}
                                                        disabled={actionLoading}
                                                        className="border border-red-300 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionLoading ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                </>
                                            )}
                                            {session.status === 'completed' && session.canReview && (
                                                <button
                                                    className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                                                    onClick={() => { setReviewSession(session); setShowReviewModal(true); }}
                                                >
                                                    Rate Session
                                                </button>
                                            )}
                                            {session.status === 'completed' && user.role === 'student' && (
                                                <button
                                                    onClick={() => handleBookAgain(session)}
                                                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
                                                >
                                                    Book Again
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No {filter !== 'all' ? filter : ''} sessions found
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {user.role === 'student'
                                        ? "You haven't booked any sessions yet. Start by finding a tutor!"
                                        : "You don't have any sessions scheduled yet. Set up your availability to get started!"
                                    }
                                </p>
                                <button
                                    onClick={() => {
                                        if (user.role === 'student') {
                                            window.location.href = '/browse-tutors';
                                        } else {
                                            window.location.href = '/tutor-availability';
                                        }
                                    }}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    {user.role === 'student' ? 'Find Tutors' : 'Set Availability'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Review Modal */}
            {showReviewModal && reviewSession && (
                <ReviewSessionModal
                    isOpen={showReviewModal}
                    onClose={() => { setShowReviewModal(false); setReviewSession(null); }}
                    session={reviewSession}
                    onSubmitted={({ rating, reviewText, isPublic }) => {
                        // Optimistically update the session so the Rate button disappears
                        setSessions(prev => prev.map(s => 
                            s.id === reviewSession.id 
                                ? { ...s, rating, canReview: false, hasReview: true }
                                : s
                        ));
                    }}
                />
            )}
        </div>
    );
};

export default MySessions;