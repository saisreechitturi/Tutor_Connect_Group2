import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sessionService, taskService } from '../../services';
import AddTaskModal from '../modals/AddTaskModal';
import BookSessionModal from '../modals/BookSessionModal';

const Calendar = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [showBookSessionModal, setShowBookSessionModal] = useState(false);

    useEffect(() => {
        const fetchCalendarData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [sessionsData, tasksData] = await Promise.all([
                    sessionService.getSessions(),
                    taskService.getTasks()
                ]);

                setSessions(sessionsData);
                setTasks(tasksData);
            } catch (err) {
                console.error('Error fetching calendar data:', err);
                setError('Failed to load calendar data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchCalendarData();
        }
    }, [user?.id]);

    const handleTaskAdded = (newTask) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleSessionBooked = (newSession) => {
        setSessions(prev => [...prev, newSession]);
    };

    // Convert sessions and tasks to calendar events
    const getCalendarEvents = () => {
        const events = [];

        // Add sessions as events
        sessions.forEach(session => {
            if (session.scheduledStart) {
                const eventDate = new Date(session.scheduledStart);
                events.push({
                    id: `session-${session.id}`,
                    title: session.subject || 'Tutoring Session',
                    date: eventDate.toISOString().split('T')[0],
                    time: eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    type: 'session',
                    status: session.status,
                    location: session.sessionType === 'online' ? 'Online' : session.locationAddress || 'In-person',
                    data: session
                });
            }
        });

        // Add tasks with due dates as events
        tasks.forEach(task => {
            if (task.dueDate) {
                const eventDate = new Date(task.dueDate);
                events.push({
                    id: `task-${task.id}`,
                    title: task.title,
                    date: eventDate.toISOString().split('T')[0],
                    time: 'Due',
                    type: 'task',
                    status: task.status,
                    priority: task.priority,
                    data: task
                });
            }
        });

        return events;
    };

    const calendarEvents = getCalendarEvents();

    // Get user events (all events are already filtered by the user context in API calls)
    const userEvents = calendarEvents;

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-red-600">
                    <h3 className="font-medium">Error loading calendar</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    // Calendar logic
    const today = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const getDayEvents = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return userEvents.filter(event => event.date === dateStr);
    };

    const getSelectedDateEvents = () => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        return userEvents.filter(event => event.date === dateStr);
    };

    const renderCalendarDay = (day) => {
        const dayEvents = getDayEvents(day);
        const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
        const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();

        return (
            <button
                key={day}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`
                    relative h-12 w-12 flex flex-col items-center justify-center rounded-lg text-sm
                    ${isSelected ? 'bg-primary-600 text-white' :
                        isToday ? 'bg-primary-100 text-primary-800 font-semibold' :
                            'hover:bg-gray-100'}
                    ${dayEvents.length > 0 ? 'font-medium' : ''}
                `}
            >
                {day}
                {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {dayEvents.slice(0, 3).map((_, index) => (
                            <div
                                key={index}
                                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary-500'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="h-6 w-6 mr-2 text-primary-600" />
                        Calendar
                    </h1>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar View */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => navigateMonth(-1)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => navigateMonth(1)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty cells for days before month starts */}
                                    {Array.from({ length: firstDayWeekday }, (_, index) => (
                                        <div key={`empty-${index}`} className="h-12" />
                                    ))}

                                    {/* Calendar days */}
                                    {Array.from({ length: daysInMonth }, (_, index) => renderCalendarDay(index + 1))}
                                </div>
                            </div>
                        </div>

                        {/* Event Details Sidebar */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-2">
                                    {selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h3>

                                <div className="space-y-3">
                                    {getSelectedDateEvents().length > 0 ? (
                                        getSelectedDateEvents().map((event) => (
                                            <div key={event.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                                <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                                                <div className="flex items-center mt-1 text-xs text-gray-600">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {event.time}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center mt-1 text-xs text-gray-600">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {event.location}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.type === 'session' ? 'bg-blue-100 text-blue-800' :
                                                        event.type === 'task' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {event.type === 'session' ? 'Session' : 'Task'}
                                                    </div>
                                                    {event.status && (
                                                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                                event.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {event.status}
                                                        </div>
                                                    )}
                                                </div>
                                                {event.priority && (
                                                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${event.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {event.priority} priority
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No events scheduled</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Add Event */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowAddTaskModal(true)}
                                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-primary-700 transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Task
                                    </button>
                                    <button
                                        onClick={() => setShowBookSessionModal(true)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Book Session
                                    </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 text-center">
                                        Events shown: {userEvents.length} total
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                onTaskAdded={handleTaskAdded}
            />

            {/* Book Session Modal */}
            <BookSessionModal
                isOpen={showBookSessionModal}
                onClose={() => setShowBookSessionModal(false)}
                onSessionBooked={handleSessionBooked}
            />
        </div>
    );
};

export default Calendar;