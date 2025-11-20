import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Plus, X, AlertCircle } from 'lucide-react';
import { messageService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import NewConversationModal from '../modals/NewConversationModal';
import socketClient from '../../services/socket';

const Messages = () => {
    const { user } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [messages, setMessages] = useState([]);
    // conversations list is derived from messages; no separate state needed
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingError, setSendingError] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevUnreadIdsRef = useRef(new Set());
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get messages and conversations list
                const messagesData = await messageService.getMessages();
                setMessages(messagesData || []);

                // Fetch unread count
                try {
                    const count = await messageService.getUnreadCount();
                    setUnreadCount(count);
                } catch (countError) {
                    console.warn('Failed to fetch unread count:', countError);
                    setUnreadCount(0);
                }

            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Failed to load messages. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    // Socket: connect and listen for new messages
    useEffect(() => {
        if (!user?.id) return;
        const token = localStorage.getItem('token');
        const sock = socketClient.connectSocket(token);
        const onNewMessage = (msg) => {
            try {
                // Only add if this message is to me or from me
                if (msg?.recipient?.id === user.id || msg?.sender?.id === user.id) {
                    // Ensure sender and recipient have proper name fields
                    const sender = msg.sender || {};
                    const recipient = msg.recipient || {};

                    // Build full sender object
                    if (!sender.name && sender.firstName && sender.lastName) {
                        sender.name = `${sender.firstName} ${sender.lastName}`;
                    } else if (!sender.firstName && !sender.name && sender.id === user.id) {
                        sender.firstName = user.firstName;
                        sender.lastName = user.lastName;
                        sender.name = `${user.firstName} ${user.lastName}`;
                    }

                    // Build full recipient object
                    if (!recipient.name && recipient.firstName && recipient.lastName) {
                        recipient.name = `${recipient.firstName} ${recipient.lastName}`;
                    } else if (!recipient.firstName && !recipient.name && recipient.id === user.id) {
                        recipient.firstName = user.firstName;
                        recipient.lastName = user.lastName;
                        recipient.name = `${user.firstName} ${user.lastName}`;
                    }

                    const newMessage = {
                        id: msg.id,
                        content: msg.content,
                        createdAt: msg.createdAt || new Date().toISOString(),
                        sender: sender,
                        recipient: recipient,
                        isRead: msg.recipient?.id === user.id ? false : true
                    };

                    setMessages(prev => [newMessage, ...prev]);

                    // If this message is for the currently open conversation, update it
                    setSelectedConversation(prev => {
                        if (!prev) return prev;

                        const otherUserId = msg.sender?.id === user.id ? msg.recipient?.id : msg.sender?.id;
                        if (prev.userId === otherUserId) {
                            return {
                                ...prev,
                                messages: [...prev.messages, newMessage].sort((a, b) =>
                                    new Date(a.createdAt) - new Date(b.createdAt)
                                ),
                                latestMessage: newMessage
                            };
                        }
                        return prev;
                    });

                    // Bump unread if I'm the recipient
                    if (msg?.recipient?.id === user.id) {
                        setUnreadCount(c => c + 1);
                    }
                }
            } catch (_) { }
        };
        sock.on('message:new', onNewMessage);
        return () => {
            try { sock.off('message:new', onNewMessage); } catch (_) { }
        };
    }, [user?.id]);

    // Poll for new messages and unread count
    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;

        const poll = async () => {
            try {
                const [msgs, count] = await Promise.all([
                    messageService.getMessages(),
                    messageService.getUnreadCount(),
                ]);

                if (cancelled) return;

                // Detect newly arrived unread messages for passive toast
                try {
                    const incomingUnread = new Set(
                        (msgs || [])
                            .filter(m => !m.isRead && m.recipient?.id === user.id)
                            .map(m => m.id)
                    );

                    // If new unread messages appeared, optionally notify
                    if (prevUnreadIdsRef.current && incomingUnread.size > prevUnreadIdsRef.current.size) {
                        // Find a latest unread message not previously seen
                        const latestUnread = (msgs || [])
                            .filter(m => !m.isRead && m.recipient?.id === user.id && !prevUnreadIdsRef.current.has(m.id))
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

                        if (latestUnread) {
                            const senderName = latestUnread.sender?.firstName && latestUnread.sender?.lastName
                                ? `${latestUnread.sender.firstName} ${latestUnread.sender.lastName}`
                                : latestUnread.sender?.name || 'New message';
                            // Fire a non-blocking toast; Toaster listens to this window event
                            window.dispatchEvent(new CustomEvent('toast', {
                                detail: { type: 'info', message: `New message from ${senderName}` }
                            }));
                        }
                    }

                    prevUnreadIdsRef.current = incomingUnread;
                } catch (_) {
                    // ignore toast detection errors
                }

                setMessages(msgs || []);
                setUnreadCount(count || 0);
            } catch (e) {
                // swallow polling errors to avoid UI spam
            }
        };

        const intervalId = setInterval(poll, 15000); // 15s
        // Kick off an early poll shortly after mount to reduce staleness
        const timeoutId = setTimeout(poll, 2000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [user?.id]);

    // Scroll to bottom when conversation changes or new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Process conversations from messages (simplified approach)
    const conversationMap = new Map();
    messages.forEach(message => {
        const otherUser = message.sender.id === user.id ? message.recipient : message.sender;

        // Ensure user object has both name and firstName/lastName
        if (!otherUser.name && otherUser.firstName && otherUser.lastName) {
            otherUser.name = `${otherUser.firstName} ${otherUser.lastName}`;
        }
        if (!otherUser.firstName && otherUser.name) {
            const nameParts = otherUser.name.split(' ');
            otherUser.firstName = nameParts[0];
            otherUser.lastName = nameParts.slice(1).join(' ');
        }

        const key = otherUser.id;

        if (!conversationMap.has(key)) {
            conversationMap.set(key, {
                userId: otherUser.id,
                user: otherUser,
                messages: [],
                latestMessage: message,
                unreadCount: 0
            });
        }

        const conv = conversationMap.get(key);
        conv.messages.push(message);

        // Update latest message if this one is newer
        if (new Date(message.createdAt) > new Date(conv.latestMessage.createdAt)) {
            conv.latestMessage = message;
        }

        // Count unread messages - only count messages where current user is recipient and message is unread
        if (!message.isRead && message.recipient?.id === user.id) {
            conv.unreadCount++;
        }
    });

    const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));

    // Filter based on search term
    const filteredConversations = conversationList.filter(conv => {
        const userName = conv.user?.firstName && conv.user?.lastName
            ? `${conv.user.firstName} ${conv.user.lastName}`.toLowerCase()
            : conv.user?.name?.toLowerCase() || '';
        const userRole = conv.user?.role?.toLowerCase() || '';
        const messageContent = conv.latestMessage?.content?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        return userName.includes(searchLower) ||
            userRole.includes(searchLower) ||
            messageContent.includes(searchLower);
    });

    const sendMessage = async () => {
        if (newMessage.trim() && selectedConversation && !sendingMessage) {
            try {
                setSendingMessage(true);
                setSendingError(null);

                await messageService.sendMessage({
                    recipientId: selectedConversation.userId,
                    messageText: newMessage.trim(), // Fixed: use messageText instead of content
                    messageType: 'direct'
                });

                setNewMessage('');

                // Refresh messages after sending
                try {
                    const updatedMessages = await messageService.getMessages();
                    setMessages(updatedMessages || []);
                } catch (refreshError) {
                    console.warn('Failed to refresh messages, adding optimistically');
                    // Add message optimistically if refresh fails
                    const newMsg = {
                        id: Date.now(),
                        content: newMessage.trim(),
                        createdAt: new Date().toISOString(),
                        sender: { id: user.id, name: user.firstName + " " + user.lastName },
                        recipient: { id: selectedConversation.userId, name: selectedConversation.user.name },
                        isRead: true
                    };
                    setMessages(prev => [...prev, newMsg]);
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                setSendingError('Failed to send message. Please try again.');
                // Auto-dismiss error after 5 seconds
                setTimeout(() => setSendingError(null), 5000);
            } finally {
                setSendingMessage(false);
            }
        }
    };

    const handleConversationStarted = (newConversation) => {
        // Add the new conversation to the conversations list
        setMessages(prev => [...prev, ...newConversation.messages]);
        setSelectedConversation(newConversation);
        setShowNewConversation(false);
    };

    const markConversationAsRead = async (conversation) => {
        if (conversation.unreadCount > 0) {
            const currentUnreadCount = conversation.unreadCount;
            try {
                await messageService.markConversationAsRead(conversation.userId);

                // Update local state to mark messages as read
                setMessages(prev => prev.map(msg => {
                    // Mark messages from this conversation as read where current user is recipient
                    if (msg.sender.id === conversation.userId && msg.recipient.id === user.id && !msg.isRead) {
                        return { ...msg, isRead: true };
                    }
                    return msg;
                }));

                // Update global unread count
                setUnreadCount(prev => Math.max(0, prev - currentUnreadCount));

            } catch (error) {
                console.warn('Failed to mark conversation as read:', error);
            }
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Inline Error Notifications */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-red-800 font-medium text-sm">Loading Error</h3>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {sendingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-red-800 font-medium text-sm">Send Error</h3>
                            <p className="text-red-600 text-sm mt-1">{sendingError}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSendingError(null)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                                    Messages
                                    {unreadCount > 0 && (
                                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </h1>
                                <button
                                    onClick={() => setShowNewConversation(true)}
                                    className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map((conversation) => (
                                    <button
                                        key={conversation.userId}
                                        onClick={async () => {
                                            setSelectedConversation(conversation);
                                            // Mark as read if there are unread messages
                                            if (conversation.unreadCount > 0) {
                                                await markConversationAsRead(conversation);
                                            }
                                        }}
                                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${selectedConversation?.userId === conversation.userId ? 'bg-primary-50 border-primary-200' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                                {conversation.user?.firstName?.[0] || conversation.user?.name?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {conversation.user?.firstName && conversation.user?.lastName
                                                                ? `${conversation.user.firstName} ${conversation.user.lastName}`
                                                                : conversation.user?.name || 'Unknown User'
                                                            }
                                                        </p>
                                                        {conversation.user?.role && (
                                                            <p className="text-xs text-gray-500 capitalize">
                                                                {conversation.user.role}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conversation.latestMessage?.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {conversation.latestMessage?.content || 'No messages yet'}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                                    <p className="text-gray-500 mb-4">Start a conversation by sending a message.</p>
                                    <button
                                        onClick={() => setShowNewConversation(true)}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Start Conversation
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                            {selectedConversation.user?.firstName?.[0] || selectedConversation.user?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {selectedConversation.user?.firstName && selectedConversation.user?.lastName
                                                    ? `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                                                    : selectedConversation.user?.name || 'Unknown User'
                                                }
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {selectedConversation.messages.length} messages
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {selectedConversation.messages
                                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                        .map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender.id === user.id
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-200 text-gray-900'
                                                        }`}
                                                >
                                                    <p className="text-sm">{message.content}</p>
                                                    <p className={`text-xs mt-1 ${message.sender.id === user.id ? 'text-primary-100' : 'text-gray-500'
                                                        }`}>
                                                        {formatTime(message.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || sendingMessage}
                                            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sendingMessage ? (
                                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                                    <p className="text-gray-500">Choose a conversation from the sidebar to start messaging.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* New Conversation Modal */}
                <NewConversationModal
                    isOpen={showNewConversation}
                    onClose={() => setShowNewConversation(false)}
                    onConversationStarted={handleConversationStarted}
                />
            </div>
        </div>
    );
};

export default Messages;