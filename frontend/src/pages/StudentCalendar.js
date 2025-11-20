import React from 'react';
import Calendar from '../components/ui/Calendar';

const StudentCalendar = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
                    <p className="mt-2 text-gray-600">
                        View your upcoming sessions and tasks in one place
                    </p>
                </div>
                <Calendar />
            </div>
        </div>
    );
};

export default StudentCalendar;