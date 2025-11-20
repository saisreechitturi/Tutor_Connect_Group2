import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    MessageSquare,
    Send,
    Plus,
    X,
    Minimize2,
    Maximize2,
    Trash2,
    Edit3,
    Bot,
    Loader,
    AlertCircle,
    Check,
    Sparkles
} from 'lucide-react';
import aiService from '../services/aiService';
import MessageBubble from './MessageBubble';
import { useAuth } from '../context/AuthContext';

const AIChat = ({ isOpen, onClose, initialMessage = '' }) => {
    const { user } = useAuth();
    // State management
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState(initialMessage);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load sessions on component mount
    useEffect(() => {
        if (isOpen) {
            setError(null); // Clear any previous errors
            loadSessions();
        }
    }, [isOpen]);

    // Auto-focus input when opening
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    // Memoized message list for performance
    const messageList = useMemo(() => {
        return messages.map((message, index) => (
            <MessageBubble key={message.id || index} message={message} />
        ));
    }, [messages]);

    /**
     * Load all chat sessions
     */
    const loadSessions = async (retryCount = 0) => {
        try {
            setIsLoading(true);
            setError(null); // Clear any previous errors
            const response = await aiService.getChatSessions();

            // Ensure response exists and has the expected structure
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }

            const sessions = response.sessions || [];
            setSessions(sessions);

            // If no current session and no sessions exist, create one
            if (!currentSession && sessions.length === 0) {
                await createNewSession();
            } else if (!currentSession && sessions.length > 0) {
                // Load the most recent session
                setCurrentSession(sessions[0]);
                await loadMessages(sessions[0].id);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            // Retry once before showing error to user
            if (retryCount < 1) {
                setTimeout(() => loadSessions(retryCount + 1), 1000);
            } else {
                setError('Unable to load chat. Please try refreshing the page.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Load messages for a specific session
     */
    const loadMessages = async (sessionId) => {
        try {
            setIsLoading(true);
            const response = await aiService.getChatMessages(sessionId);
            setMessages(response.messages || []);
        } catch (error) {
            setError('Failed to load messages');
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create a new chat session
     */
    const createNewSession = async (title = 'New Chat') => {
        try {
            const response = await aiService.createChatSession(title);
            const newSession = response.session;

            setSessions(prev => [newSession, ...prev]);
            setCurrentSession(newSession);
            setMessages([]);
            setShowSessions(false);

            return newSession;
        } catch (error) {
            setError('Failed to create new chat session');
            console.error('Error creating session:', error);
        }
    };

    /**
     * Switch to a different session
     */
    const switchToSession = async (session) => {
        setCurrentSession(session);
        setShowSessions(false);
        await loadMessages(session.id);
    };

    /**
     * Send a message to AI
     */
    const handleSendMessage = useCallback(async (messageText = inputMessage) => {
        const validation = aiService.validateMessage(messageText);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        if (!currentSession) {
            const newSession = await createNewSession();
            if (!newSession) return;
        }

        setIsSending(true);
        setError(null);

        try {
            // Add user message to UI immediately
            const userMessage = {
                id: Date.now(),
                message_type: 'user',
                content: validation.message,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMessage]);
            setInputMessage('');

            // Send to AI
            const response = await aiService.sendMessage(currentSession.id, validation.message);

            if (response.success) {
                // Replace temporary user message and add AI response
                setMessages(prev => [
                    ...prev.slice(0, -1), // Remove temporary message
                    response.userMessage,
                    response.aiMessage
                ]);

                // Update session in list if title changed
                if (response.userMessage && sessions.length > 0) {
                    const updatedSessions = await aiService.getChatSessions();
                    setSessions(updatedSessions.sessions || []);
                }
            } else {
                setError('Failed to get AI response');
            }
        } catch (error) {
            setError('Failed to send message');
            console.error('Error sending message:', error);
            // Remove the temporary user message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsSending(false);
        }
    }, [currentSession, inputMessage, sessions]);

    // Handle initial message
    useEffect(() => {
        if (initialMessage && isOpen && currentSession) {
            handleSendMessage(initialMessage);
        }
    }, [initialMessage, isOpen, currentSession, handleSendMessage]);

    /**
     * Handle form submission
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isSending) {
            handleSendMessage();
        }
    };

    /**
     * Delete a session
     */
    const deleteSession = async (sessionId) => {
        try {
            await aiService.deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (currentSession?.id === sessionId) {
                const remainingSessions = sessions.filter(s => s.id !== sessionId);
                if (remainingSessions.length > 0) {
                    await switchToSession(remainingSessions[0]);
                } else {
                    setCurrentSession(null);
                    setMessages([]);
                    await createNewSession();
                }
            }
        } catch (error) {
            setError('Failed to delete session');
            console.error('Error deleting session:', error);
        }
    };

    /**
     * Update session title
     */
    const updateSessionTitle = async (sessionId, newTitle) => {
        try {
            await aiService.updateChatSession(sessionId, { title: newTitle });
            setSessions(prev => prev.map(s =>
                s.id === sessionId ? { ...s, title: newTitle } : s
            ));
            if (currentSession?.id === sessionId) {
                setCurrentSession(prev => ({ ...prev, title: newTitle }));
            }
        } catch (error) {
            setError('Failed to update session title');
            console.error('Error updating session:', error);
        }
    };

    /**
     * Start editing session title
     */
    const startEditingTitle = (session) => {
        setEditingSessionId(session.id);
        setEditingTitle(session.title);
    };

    /**
     * Save edited title
     */
    const saveEditedTitle = async () => {
        if (editingTitle.trim() && editingSessionId) {
            await updateSessionTitle(editingSessionId, editingTitle.trim());
        }
        setEditingSessionId(null);
        setEditingTitle('');
    };

    /**
     * Cancel editing title
     */
    const cancelEditingTitle = () => {
        setEditingSessionId(null);
        setEditingTitle('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[54rem] h-[48rem] max-w-4xl bg-white rounded-lg border border-gray-200 shadow-2xl">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="font-semibold">AI {user?.role === 'tutor' ? 'Teaching' : 'Study'} Assistant</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white hover:text-blue-100 transition-colors"
                        aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-blue-100 transition-colors"
                        aria-label="Close AI Assistant"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Session Management Bar */}
                    <div className="bg-gray-50 p-2 border-b border-gray-200 flex items-center justify-between">
                        <button
                            onClick={() => setShowSessions(!showSessions)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {currentSession?.title || 'New Chat'}
                        </button>
                        <button
                            onClick={() => createNewSession()}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            aria-label="New Chat"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Sessions List */}
                    {showSessions && (
                        <div className="bg-white border-b border-gray-200 max-h-32 overflow-y-auto">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                    {editingSessionId === session.id ? (
                                        <div className="flex-1 flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEditedTitle();
                                                    if (e.key === 'Escape') cancelEditingTitle();
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveEditedTitle}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={cancelEditingTitle}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => switchToSession(session)}
                                                className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900 truncate"
                                            >
                                                {session.title}
                                            </button>
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => startEditingTitle(session)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => deleteSession(session.id)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3">
                            <div className="flex items-start">
                                <AlertCircle className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-700 mb-2">{error}</p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setError(null);
                                                loadSessions();
                                            }}
                                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                        >
                                            Retry
                                        </button>
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isLoading && messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center text-gray-500">
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Loading chat...
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Bot className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">
                                    {user?.role === 'tutor'
                                        ? "Hi! I'm your AI Teaching Assistant. Ask me about teaching strategies, lesson planning, student engagement, or educational best practices!"
                                        : "Hi! I'm your AI Study Assistant. Ask me anything about your studies!"
                                    }
                                </p>
                            </div>
                        ) : (
                            messageList
                        )}
                        {isSending && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-800 max-w-2xl lg:max-w-4xl px-3 py-2 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Bot className="h-4 w-4" />
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 p-4">
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSending}
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isSending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSending ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-1">
                            {inputMessage.length}/2000 characters
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChat;