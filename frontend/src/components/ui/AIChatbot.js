import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

// Mock AI data - in a real app this would come from an AI service
const aiResponses = {
    greeting: "Hello! I'm your TutorConnect AI assistant. I can help you with scheduling sessions, finding tutors, or answering questions about the platform.",
    scheduling: "I can help you schedule a tutoring session. What subject are you looking for help with?",
    tutors: "I can recommend tutors based on your needs. What subject and skill level are you looking for?",
    help: "I'm here to help with any questions about TutorConnect. You can ask me about scheduling, finding tutors, managing your profile, or platform features.",
    default: "That's a great question! Let me help you with that. Could you provide more specific details?"
};

const aiSuggestions = [
    "Find a math tutor",
    "Schedule a session",
    "How do I pay for sessions?",
    "Update my profile",
    "Cancel a session",
    "Rate my tutor"
];

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: "Hello! I'm your AI study assistant. I can help you with platform questions, study tips, and subject-specific guidance. What would you like to know?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const getAIResponse = (query) => {
        const lowerQuery = query.toLowerCase();

        // Check for specific keywords and return appropriate responses
        for (const [key, response] of Object.entries(aiResponses)) {
            if (key === 'default' || key === 'greeting') continue;

            if (lowerQuery.includes(key) ||
                (key === 'how to book' && (lowerQuery.includes('book') || lowerQuery.includes('session'))) ||
                (key === 'find tutors' && (lowerQuery.includes('find') || lowerQuery.includes('tutor'))) ||
                (key === 'study tips' && (lowerQuery.includes('study') || lowerQuery.includes('tip'))) ||
                (key === 'time management' && (lowerQuery.includes('time') || lowerQuery.includes('manage'))) ||
                (key === 'motivation' && (lowerQuery.includes('motivat') || lowerQuery.includes('inspire')))) {
                return response;
            }
        }

        // Default response
        return aiResponses.default;
    };

    const handleSendMessage = async (message = inputValue.trim()) => {
        if (!message) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI thinking time
        setTimeout(() => {
            const aiResponse = getAIResponse(message);
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
                aria-label="Open AI Assistant"
            >
                <MessageCircle className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    <span className="font-semibold">AI Study Assistant</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-primary-100 transition-colors"
                    aria-label="Close AI Assistant"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start space-x-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {message.type === 'bot' && (
                            <div className="bg-primary-100 p-2 rounded-full">
                                <Bot className="h-4 w-4 text-primary-600" />
                            </div>
                        )}
                        <div
                            className={`max-w-xs px-3 py-2 rounded-lg ${message.type === 'user'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                                }`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        {message.type === 'user' && (
                            <div className="bg-gray-200 p-2 rounded-full">
                                <User className="h-4 w-4 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-start space-x-2">
                        <div className="bg-primary-100 p-2 rounded-full">
                            <Bot className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="px-4 py-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-1">
                        {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white p-2 rounded-md transition-colors"
                        aria-label="Send message"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;