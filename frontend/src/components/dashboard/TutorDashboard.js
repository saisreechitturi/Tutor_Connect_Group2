import React from 'react';

const TutorDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold">Tutor Dashboard</h1>
                <p className="mt-2 text-green-100">
                    Manage your students, sessions, and track your teaching progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Students</h3>
                    <p className="text-3xl font-bold text-green-600">12</p>
                    <p className="text-sm text-gray-500 mt-1">Currently enrolled</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Sessions</h3>
                    <p className="text-3xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-gray-500 mt-1">This week</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Earnings (MTD)</h3>
                    <p className="text-3xl font-bold text-purple-600">$1,240</p>
                    <p className="text-sm text-gray-500 mt-1">This month</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <p className="text-gray-600">
                    Welcome to your tutor dashboard! Here you can manage your students, track sessions, and monitor your teaching progress.
                </p>
            </div>
        </div>
    );
};

export default TutorDashboard;
