import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AIChat from './AIChat';

const FloatingAIAssistant = ({ initialMessage = '' }) => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    // Only show AI assistant to authenticated students and tutors
    if (!isAuthenticated || (user?.role !== 'student' && user?.role !== 'tutor')) {
        return null;
    }

    const handleOpen = () => {
        setIsOpen(true);
        setHasNewMessage(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label={`Open AI ${user?.role === 'tutor' ? 'Teaching' : 'Study'} Assistant`}
                >
                    <div className="relative">
                        <Sparkles className="h-6 w-6" />
                        {hasNewMessage && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                </button>
            )}

            {/* AI Chat Component */}
            <AIChat
                isOpen={isOpen}
                onClose={handleClose}
                initialMessage={initialMessage}
            />
        </>
    );
};

export default FloatingAIAssistant;