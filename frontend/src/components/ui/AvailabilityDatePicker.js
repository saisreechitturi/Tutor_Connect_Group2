import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const AvailabilityDatePicker = ({
    value,
    onChange,
    tutorId,
    duration = 60,
    dateAvailability = {},
    onDateAvailabilityLoad,
    minDate
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isOpen, setIsOpen] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Load availability data when month changes
    useEffect(() => {
        if (tutorId && isOpen) {
            loadMonthAvailability();
        }
    }, [currentMonth, tutorId, duration, isOpen]);

    const loadMonthAvailability = async () => {
        try {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            if (onDateAvailabilityLoad) {
                await onDateAvailabilityLoad(startDateStr, endDateStr);
            }
        } catch (error) {
            console.error('Error loading month availability:', error);
        }
    };

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return 'Select a date';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isDateDisabled = (date) => {
        if (!date) return true;
        const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : new Date();
        minDateObj.setHours(0, 0, 0, 0);

        return date < minDateObj;
    };

    const getDateAvailabilityClass = (date) => {
        if (!date || isDateDisabled(date)) return '';

        const availability = dateAvailability[formatDate(date)];

        if (!availability) return '';

        if (availability.hasAvailability) {
            return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
        }

        return 'bg-red-50 border-red-200 text-red-600';
    };

    const isSelectedDate = (date) => {
        if (!date || !value) return false;
        return formatDate(date) === value;
    };

    const handleDateClick = (date) => {
        if (isDateDisabled(date)) return;

        const dateStr = formatDate(date);
        onChange(dateStr);
        setIsOpen(false);
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(prev.getMonth() + direction);
            return newMonth;
        });
    };

    const days = getDaysInMonth();

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
            </label>

            {/* Date Input Display */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white flex items-center justify-between"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                    {formatDisplayDate(value)}
                </span>
                <Calendar className="h-5 w-5 text-gray-400" />
            </div>

            {/* Calendar Popup */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigateMonth(-1)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>

                        <h3 className="text-lg font-semibold text-gray-900">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>

                        <button
                            type="button"
                            onClick={() => navigateMonth(1)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 gap-1 p-2 text-center text-sm text-gray-600 border-b border-gray-200">
                        {weekDays.map(day => (
                            <div key={day} className="p-2 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1 p-2">
                        {days.map((date, index) => (
                            <div key={index} className="aspect-square">
                                {date && (
                                    <button
                                        type="button"
                                        onClick={() => handleDateClick(date)}
                                        disabled={isDateDisabled(date)}
                                        className={`
                                            w-full h-full rounded text-sm font-medium transition-colors border
                                            ${isSelectedDate(date)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : isDateDisabled(date)
                                                    ? 'text-gray-300 cursor-not-allowed border-transparent'
                                                    : `border-gray-200 hover:border-gray-300 ${getDateAvailabilityClass(date) || 'hover:bg-gray-50'}`
                                            }
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                                    <span>No availability</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default AvailabilityDatePicker;