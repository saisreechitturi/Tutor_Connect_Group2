import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        <span className="text-primary-600">TutorConnect</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Connect with expert tutors, organize your studies with AI assistance,
                        and achieve your academic goals with personalized learning paths.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="btn-primary px-8 py-3 text-lg font-semibold rounded-lg"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/browse-tutors"
                            className="btn-secondary px-8 py-3 text-lg font-semibold rounded-lg"
                        >
                            Browse Tutors
                        </Link>
                        <Link
                            to="/login"
                            className="btn-secondary px-8 py-3 text-lg font-semibold rounded-lg"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Tutors</h3>
                        <p className="text-gray-600">
                            Connect with verified tutors across various subjects. Browse profiles,
                            read reviews, and book sessions that fit your schedule.
                        </p>
                        <div className="mt-4">
                            <Link
                                to="/browse-tutors"
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Browse All Tutors →
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Planning</h3>
                        <p className="text-gray-600">
                            Organize your study schedule with our intelligent task manager and
                            calendar integration. Track progress and stay on top of deadlines.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Assistant</h3>
                        <p className="text-gray-600">
                            Get instant help with our AI-powered study assistant. Ask questions,
                            get study tips, and receive personalized learning recommendations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary-600">1,000+</div>
                            <div className="text-gray-600 mt-1">Active Students</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-600">500+</div>
                            <div className="text-gray-600 mt-1">Expert Tutors</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-600">10,000+</div>
                            <div className="text-gray-600 mt-1">Sessions Completed</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-600">4.9/5</div>
                            <div className="text-gray-600 mt-1">Average Rating</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Transform Your Learning?
                    </h2>
                    <p className="text-xl mb-8 text-primary-100">
                        Join thousands of students already achieving their academic goals.
                    </p>
                    <Link
                        to="/signup"
                        className="bg-white text-primary-600 px-8 py-3 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
                    >
                        Start Learning Today
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;