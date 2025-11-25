import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Plus, RefreshCw, AlertCircle, CheckSquare, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calendarService } from '../../services';
import { exportToICalendar } from '../../utils/icalGenerator';
import AddTaskModal from '../modals/AddTaskModal';
import BookSessionModal from '../modals/BookSessionModal';
import TaskDetailsModal from '../modals/TaskDetailsModal';

const Calendar = () => {
    const { user } = useAuth();
    const userRole = user?.role || 'student'; // Default to student for safety
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [eventsByDate, setEventsByDate] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [showBookSessionModal, setShowBookSessionModal] = useState(false);
    const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Fetch calendar data with error handling and fallback
    const fetchCalendarData = useCallback(async (showLoadingState = true) => {
        try {
            if (showLoadingState) {
                setLoading(true);
            }
            setError(null);

            // Get the current month's date range
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const calendarData = await calendarService.getCalendarEvents({
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString(),
                type: 'all',
                view: 'month'
            });

            // Transform data for calendar display
            const events = Array.isArray(calendarData.events) ? calendarData.events : [];
            const eventsGrouped = {};

            // Group events by date for easy lookup
            events.forEach(event => {
                // Try multiple date fields and validate
                let eventDate = null;
                const possibleDates = [
                    event.session_date,
                    event.scheduled_start,
                    event.due_date,
                    event.scheduled_at,
                    event.dueDate,
                    event.scheduledStart,
                    event.start
                ];

                for (const dateField of possibleDates) {
                    if (dateField) {
                        const testDate = new Date(dateField);
                        if (!isNaN(testDate.getTime())) {
                            eventDate = testDate;
                            break;
                        }
                    }
                }

                // Skip events without valid dates
                if (!eventDate) {
                    console.warn('Event has no valid date:', event);
                    return;
                }

                const dateKey = eventDate.toISOString().split('T')[0];

                if (!eventsGrouped[dateKey]) {
                    eventsGrouped[dateKey] = [];
                }
                eventsGrouped[dateKey].push({
                    ...event,
                    type: event.type || (event.session_type ? 'session' : 'task'),
                    time: event.time || event.start_time || event.scheduled_time || '00:00',
                    status: event.status || 'scheduled',
                    // Normalize progress for completed tasks
                    progress: event.status === 'completed' ? 100 : (event.progress || event.progressPercentage || event.progress_percentage || 0),
                    progressPercentage: event.status === 'completed' ? 100 : (event.progress || event.progressPercentage || event.progress_percentage || 0)
                });
            });

            setCalendarEvents(events);
            setEventsByDate(eventsGrouped);
        } catch (err) {
            console.error('Error fetching calendar data:', err);

            // Provide fallback data structure to prevent UI crashes
            setCalendarEvents([]);
            setEventsByDate({});

            // Set appropriate error message based on error type
            if (err.response?.status === 401) {
                setError('Authentication required. Please log in again.');
            } else if (err.response?.status === 403) {
                setError('Access denied. Please check your permissions.');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else if (err.code === 'NETWORK_ERROR' || !navigator.onLine) {
                setError('No internet connection. Please check your connection and try again.');
            } else {
                setError('Unable to load calendar data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        if (user?.id) {
            fetchCalendarData();
        } else {
            // User not authenticated - show sample data with informational message
            setLoading(false);
            setError('Please log in to view your personal calendar events.');

            // Load sample data for demo purposes
            try {
                const sampleData = calendarService.getSampleCalendarData();
                setCalendarEvents(sampleData.events);
                setEventsByDate(sampleData.eventsByDate);
                console.log('Loaded sample calendar data:', sampleData);
            } catch (error) {
                console.error('Failed to load sample calendar data:', error);
                setCalendarEvents([]);
                setEventsByDate({});
            }
        }
    }, [user?.id, fetchCalendarData]);

    const handleTaskClick = (event) => {
        if (event.type === 'task') {
            // Extract task ID from event.id (format: 'task-{uuid}')
            let taskId = event.taskId || event.id;

            // If ID has 'task-' prefix, remove it
            if (typeof taskId === 'string' && taskId.startsWith('task-')) {
                taskId = taskId.replace('task-', '');
            }

            setSelectedTask({
                ...event,
                id: taskId,
                dueDate: event.dueDate || event.due_date || event.start,
                estimatedHours: event.estimatedHours || event.estimated_hours,
                progress: event.status === 'completed' ? 100 : (event.progress || event.progressPercentage || event.progress_percentage || 0),
                progressPercentage: event.status === 'completed' ? 100 : (event.progress || event.progressPercentage || event.progress_percentage || 0)
            });
            setShowTaskDetailsModal(true);
        }
    };

    const handleTaskUpdated = (updatedTask) => {
        // Normalize the updated task
        const normalized = {
            ...updatedTask,
            progress: updatedTask.status === 'completed' ? 100 : (updatedTask.progress || 0),
            progressPercentage: updatedTask.status === 'completed' ? 100 : (updatedTask.progressPercentage || 0)
        };

        // Update the task in calendar events
        setCalendarEvents(prev => prev.map(event =>
            event.id === `task-${normalized.id}` || event.taskId === normalized.id
                ? { ...event, ...normalized, type: 'task' }
                : event
        ));

        // Refresh calendar to get latest data
        fetchCalendarData(false);
    };

    const handleTaskAdded = async (newTask) => {
        // Optimistically add task to local state
        if (newTask && newTask.task) {
            const task = newTask.task;
            const taskDate = new Date(task.dueDate || task.createdAt);

            // Validate date before using toISOString
            if (!isNaN(taskDate.getTime())) {
                const dateKey = taskDate.toISOString().split('T')[0];

                const taskEvent = {
                    ...task,
                    type: 'task',
                    time: task.due_time || '09:00',
                    status: task.status || 'pending',
                    due_date: task.dueDate // For backward compatibility
                };

                setCalendarEvents(prev => [...prev, taskEvent]);
                setEventsByDate(prev => ({
                    ...prev,
                    [dateKey]: [...(prev[dateKey] || []), taskEvent]
                }));
            }
        }

        // Refresh calendar data after task is added
        try {
            await fetchCalendarData(false); // Don't show loading state for refresh
        } catch (err) {
            console.error('Error refreshing calendar after task added:', err);
        }
    };

    const handleSessionBooked = async (newSession) => {
        // Optimistically add session to local state
        if (newSession && newSession.session) {
            const session = newSession.session;
            const sessionDate = new Date(session.scheduledStart || session.createdAt);

            // Validate date before using toISOString
            if (!isNaN(sessionDate.getTime())) {
                const dateKey = sessionDate.toISOString().split('T')[0];

                const sessionEvent = {
                    ...session,
                    type: 'session',
                    time: session.start_time || '10:00',
                    status: session.status || 'scheduled',
                    session_date: session.scheduledStart, // For backward compatibility
                    scheduled_at: session.scheduledStart
                };

                setCalendarEvents(prev => [...prev, sessionEvent]);
                setEventsByDate(prev => ({
                    ...prev,
                    [dateKey]: [...(prev[dateKey] || []), sessionEvent]
                }));
            }
        }

        // Refresh calendar data after session is booked
        try {
            await fetchCalendarData(false); // Don't show loading state for refresh
        } catch (err) {
            console.error('Error refreshing calendar after session booked:', err);
        }
    };

    // Navigation handlers
    const goToPreviousMonth = () => {
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentDate(prevMonth);
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentDate(nextMonth);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Utility functions
    const formatDate = (date) => {
        if (!date || isNaN(new Date(date).getTime())) {
            return 'Invalid Date';
        }
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        if (time === 'Due') return 'Due';
        try {
            const [hours, minutes] = time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return time;
        }
    };

    const getEventsForDate = (date) => {
        const dateKey = date.toISOString().split('T')[0];
        return eventsByDate[dateKey] || [];
    };

    const getEventColor = (event) => {
        if (event.type === 'session') {
            switch (event.status) {
                case 'completed': return 'bg-green-100 text-green-800 border-green-200';
                case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
                case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        } else {
            // For tasks, use priority-based colors
            if (event.status === 'completed') {
                return 'bg-green-100 text-green-800 border-green-200';
            }

            switch (event.priority) {
                case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
                case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
                case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        }
    };

    const getPriorityDotColor = (event) => {
        if (event.type === 'session') {
            return 'bg-blue-500';
        } else {
            if (event.status === 'completed') return 'bg-green-500';

            switch (event.priority) {
                case 'urgent': return 'bg-red-500';
                case 'high': return 'bg-orange-500';
                case 'medium': return 'bg-yellow-500';
                case 'low': return 'bg-blue-500';
                default: return 'bg-gray-500';
            }
        }
    };

    // Retry function for error recovery
    const handleRetry = () => {
        fetchCalendarData();
    };

    // Export calendar to iCalendar format
    const handleExportCalendar = () => {
        if (!calendarEvents || calendarEvents.length === 0) {
            alert('No events to export. Please add some events to your calendar first.');
            return;
        }

        const calendarName = user?.role === 'student'
            ? 'TutorConnect - Student Calendar'
            : user?.role === 'tutor'
                ? 'TutorConnect - Tutor Calendar'
                : 'TutorConnect Calendar';

        const result = exportToICalendar(calendarEvents, calendarName);

        if (result.success) {
            // Show success feedback
            const eventCount = calendarEvents.length;
            alert(`✓ Successfully exported ${eventCount} event${eventCount !== 1 ? 's' : ''} to iCalendar file!\n\nYou can import this file into Google Calendar, Outlook, Apple Calendar, or any other calendar application.`);
        } else {
            alert(`✗ Failed to export calendar: ${result.message}`);
        }
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);

        // Start from Sunday
        startDate.setDate(firstDay.getDate() - firstDay.getDay());

        const days = [];
        const today = new Date();

        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const events = getEventsForDate(date);

            days.push({
                date,
                day: date.getDate(),
                isCurrentMonth,
                isToday,
                isSelected,
                events,
                hasEvents: events.length > 0
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                        Calendar
                    </h1>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                        Calendar
                    </h1>
                    <button
                        onClick={handleRetry}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </button>
                </div>
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load calendar</h3>
                    <p className="text-gray-600 mb-4">{error}</p>

                    {error.includes('log in') ? (
                        <div className="max-w-md mx-auto">
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Calendar requires login</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                    Your calendar shows different content based on your role:
                                </p>
                                <ul className="text-sm text-blue-700 text-left space-y-1">
                                    <li>🎓 <strong>Students:</strong> Study sessions, tasks, and appointments</li>
                                    <li>👨‍🏫 <strong>Tutors:</strong> Tutoring sessions and availability</li>
                                    <li>⚙️ <strong>Admins:</strong> Platform-wide activity overview</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <a
                                    href="#/login"
                                    className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Log In to View Calendar
                                </a>
                                <a
                                    href="#/register"
                                    className="block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Create Account
                                </a>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Demo Data Banner - shown when user is not authenticated */}
            {!user?.id && calendarEvents.length > 0 && (
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-blue-800">
                                Viewing Sample Calendar Data
                            </h3>
                            <p className="text-sm text-blue-700 mt-1">
                                This is demo data to show how your calendar would look.
                                <a href="#/login" className="font-medium underline hover:text-blue-800 ml-1">
                                    Log in
                                </a> to see your personal events and schedule.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                        Calendar
                    </h1>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportCalendar}
                            disabled={!calendarEvents || calendarEvents.length === 0}
                            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            title="Export calendar to iCal format"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export iCal
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => fetchCalendarData()}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh calendar"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Calendar */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Calendar Navigation */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {formatDate(currentDate)}
                            </h2>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={goToNextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`
                                            relative p-1 h-20 border-r border-b border-gray-200 text-left hover:bg-gray-50 transition-colors flex flex-col
                                            ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'text-gray-900'}
                                            ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                                            ${day.isSelected ? 'bg-blue-100 border-blue-300' : ''}
                                        `}
                                    >
                                        {/* Date number at top-left */}
                                        <div className={`
                                            w-6 h-6 text-sm rounded-full flex items-center justify-center flex-shrink-0
                                            ${day.isToday ? 'bg-blue-600 text-white font-semibold' : ''}
                                            ${day.isSelected && !day.isToday ? 'bg-blue-500 text-white' : ''}
                                        `}>
                                            {day.day}
                                        </div>

                                        {/* Event Indicators - positioned below date */}
                                        {day.hasEvents && (
                                            <div className="mt-1 flex-1 overflow-hidden">
                                                <div className="space-y-0.5">
                                                    {day.events.slice(0, 2).map((event, eventIndex) => (
                                                        <div
                                                            key={eventIndex}
                                                            className="flex items-center gap-1"
                                                            title={`${event.title || 'Untitled'} ${event.type === 'task' ? `(${event.priority || 'medium'} priority)` : ''}`}
                                                        >
                                                            <div className={`h-1.5 w-1.5 rounded-full ${getPriorityDotColor(event)} flex-shrink-0`} />
                                                            <span className="text-xs truncate">
                                                                {event.title || event.description || 'Untitled'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {day.events.length > 2 && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        +{day.events.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Selected Date Events */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {selectedDate && !isNaN(selectedDate.getTime())
                                    ? selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : 'Select a date'
                                }
                            </h3>

                            <div className="space-y-2">
                                {getEventsForDate(selectedDate).length > 0 ? (
                                    getEventsForDate(selectedDate).map((event, index) => (
                                        <div
                                            key={index}
                                            onClick={() => event.type === 'task' && handleTaskClick(event)}
                                            className={`p-3 rounded-lg border ${getEventColor(event)} ${event.type === 'task' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm">
                                                        {event.title || event.notes || event.description || 'Untitled Event'}
                                                    </h4>
                                                    {event.type === 'task' && (event.dueDate || event.due_date || event.start) && (
                                                        <p className="text-xs mt-1 flex items-center text-gray-600">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Due: {new Date(event.dueDate || event.due_date || event.start).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    )}
                                                    {event.type === 'session' && event.time && (
                                                        <p className="text-xs mt-1 flex items-center text-gray-600">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {formatTime(event.time)}
                                                        </p>
                                                    )}
                                                    {event.location && (
                                                        <p className="text-xs mt-1 flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {event.location}
                                                        </p>
                                                    )}
                                                    {/* Role-specific info */}
                                                    {event.type === 'session' && (
                                                        <p className="text-xs mt-1 text-gray-600">
                                                            {userRole === 'student' && event.tutor?.name && `with ${event.tutor.name}`}
                                                            {userRole === 'tutor' && event.student?.name && `with ${event.student.name}`}
                                                            {userRole === 'admin' && event.subject && `${event.subject}`}
                                                        </p>
                                                    )}
                                                    {/* Task priority info */}
                                                    {event.type === 'task' && event.priority && (
                                                        <p className="text-xs mt-1 text-gray-600 capitalize">
                                                            {event.priority} priority
                                                        </p>
                                                    )}
                                                    {/* Task progress indicator */}
                                                    {event.type === 'task' && (event.progress > 0 || event.status === 'completed') && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-xs text-gray-600">Progress</span>
                                                            <div className="relative flex-shrink-0" title={`${event.status === 'completed' ? 100 : (event.progress || 0)}% complete`}>
                                                                <svg className="w-8 h-8 transform -rotate-90">
                                                                    <circle
                                                                        cx="16"
                                                                        cy="16"
                                                                        r="12"
                                                                        stroke="currentColor"
                                                                        strokeWidth="3"
                                                                        fill="none"
                                                                        className="text-gray-200"
                                                                    />
                                                                    <circle
                                                                        cx="16"
                                                                        cy="16"
                                                                        r="12"
                                                                        stroke="currentColor"
                                                                        strokeWidth="3"
                                                                        fill="none"
                                                                        strokeDasharray={`${2 * Math.PI * 12}`}
                                                                        strokeDashoffset={`${2 * Math.PI * 12 * (1 - (event.status === 'completed' ? 100 : (event.progress || 0)) / 100)}`}
                                                                        className={`${event.status === 'completed' ? 'text-green-600' : 'text-blue-600'} transition-all`}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    {event.status === 'completed' ? (
                                                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                                                    ) : (
                                                                        <span className="text-[9px] font-semibold text-gray-700">{event.progress || 0}%</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                                                        {event.type === 'session' ? 'Session' : 'Task'}
                                                    </span>
                                                    {event.type === 'task' && event.status && (
                                                        <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded capitalize">
                                                            {event.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-sm">No events scheduled</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                {/* Show Add Task button for students and tutors only */}
                                {userRole !== 'admin' && (
                                    <button
                                        onClick={() => setShowAddTaskModal(true)}
                                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Task
                                    </button>
                                )}
                                {/* Different session button text based on role */}
                                {userRole === 'student' && (
                                    <button
                                        onClick={() => setShowBookSessionModal(true)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Book Session
                                    </button>
                                )}
                                {userRole === 'tutor' && (
                                    <button
                                        onClick={() => setShowBookSessionModal(true)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Schedule Session
                                    </button>
                                )}
                                {/* Admin sees view for overview only */}
                                {userRole === 'admin' && (
                                    <div className="text-sm text-gray-600 text-center py-2">
                                        <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p>View platform-wide calendar activity</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Calendar Stats */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">This Month</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Events:</span>
                                    <span className="font-medium">{calendarEvents.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {userRole === 'admin' ? 'Platform Sessions:' : 'Sessions:'}
                                    </span>
                                    <span className="font-medium">
                                        {calendarEvents.filter(e => e.type === 'session').length}
                                    </span>
                                </div>
                                {userRole !== 'admin' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tasks:</span>
                                        <span className="font-medium">
                                            {calendarEvents.filter(e => e.type === 'task').length}
                                        </span>
                                    </div>
                                )}
                                {userRole === 'tutor' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Students:</span>
                                        <span className="font-medium">
                                            {new Set(calendarEvents
                                                .filter(e => e.type === 'session' && e.student?.name)
                                                .map(e => e.student.name)
                                            ).size}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddTaskModal && (
                <AddTaskModal
                    isOpen={showAddTaskModal}
                    onClose={() => setShowAddTaskModal(false)}
                    onTaskAdded={handleTaskAdded}
                    initialDate={selectedDate}
                />
            )}

            {showBookSessionModal && (
                <BookSessionModal
                    isOpen={showBookSessionModal}
                    onClose={() => setShowBookSessionModal(false)}
                    onSessionBooked={handleSessionBooked}
                    initialDate={selectedDate}
                />
            )}

            {showTaskDetailsModal && selectedTask && (
                <TaskDetailsModal
                    isOpen={showTaskDetailsModal}
                    onClose={() => {
                        setShowTaskDetailsModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    onTaskUpdated={handleTaskUpdated}
                />
            )}
        </div>
    );
};

export default Calendar;