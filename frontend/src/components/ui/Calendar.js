import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Calendar = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // TODO: Replace with API call to fetch calendar events
    const calendarEvents = [];

    // Get user events
    const userEvents = calendarEvents.filter(event => event.userId === user.id);

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
                                                <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${event.type === 'session' ? 'bg-blue-100 text-blue-800' :
                                                    event.type === 'assignment' ? 'bg-red-100 text-red-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {event.type}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No events scheduled</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Add Event */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Quick Add Event</h3>
                                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-primary-700 transition-colors">
                                    Add New Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;