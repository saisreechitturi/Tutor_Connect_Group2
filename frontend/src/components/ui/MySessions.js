import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, MapPin, Star, Filter, Plus } from 'lucide-react';
import { sessions } from '../../data';
import { useAuth } from '../../context/AuthContext';

const MySessions = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Get user sessions
    const userSessions = sessions.filter(s =>
        user.role === 'student' ? s.studentId === user.id : s.tutorId === user.id
    );

    // Filter sessions based on status
    const filteredSessions = userSessions.filter(session => {
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
            all: userSessions.length,
            scheduled: userSessions.filter(s => s.status === 'scheduled').length,
            completed: userSessions.filter(s => s.status === 'completed').length,
            cancelled: userSessions.filter(s => s.status === 'cancelled').length
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
                        <button
                            onClick={() => setShowBookingModal(true)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {user.role === 'student' ? 'Book Session' : 'Add Availability'}
                        </button>
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
                                                <h3 className="text-lg font-semibold text-gray-900">{session.subject}</h3>
                                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                                                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    <span>{session.scheduledTime} ({session.duration} min)</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    <span>{session.type === 'online' ? 'Online' : 'In-person'}</span>
                                                </div>
                                            </div>

                                            {session.notes && (
                                                <div className="mt-3 p-3 bg-white rounded border">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Notes:</strong> {session.notes}
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
                                                    <button className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors">
                                                        Join Session
                                                    </button>
                                                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                                                        Reschedule
                                                    </button>
                                                    <button className="border border-red-300 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-50 transition-colors">
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {session.status === 'completed' && !session.rating && (
                                                <button className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 transition-colors">
                                                    Rate Session
                                                </button>
                                            )}
                                            {session.status === 'completed' && (
                                                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
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
                                    onClick={() => setShowBookingModal(true)}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    {user.role === 'student' ? 'Find Tutors' : 'Set Availability'}
                                </button>
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
        </div>
    );
};

export default MySessions;