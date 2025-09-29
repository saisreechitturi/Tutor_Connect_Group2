import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Plus } from 'lucide-react';
import { messageService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
    const { user } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get messages and conversations list
                const [messagesData, conversationsData] = await Promise.all([
                    messageService.getMessages(),
                    messageService.getConversationsList().catch(() => []) // Fallback to empty array if not implemented
                ]);

                setMessages(messagesData);
                setConversations(conversationsData);

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

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-red-600">
                    <h3 className="font-medium">Error loading messages</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    // Process conversations from messages (simplified approach)
    const conversationMap = new Map();
    messages.forEach(message => {
        const otherUser = message.sender.id === user.id ? message.recipient : message.sender;
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

        // Count unread messages
        if (!message.isRead && message.recipient.id === user.id) {
            conv.unreadCount++;
        }
    });

    const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));

    // Filter based on search term
    const filteredConversations = conversationList.filter(conv =>
        conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.latestMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sendMessage = async () => {
        if (newMessage.trim() && selectedConversation) {
            try {
                await messageService.sendMessage({
                    recipientId: selectedConversation.userId,
                    content: newMessage.trim(),
                    messageType: 'direct'
                });
                setNewMessage('');
                // Refresh messages after sending
                const updatedMessages = await messageService.getMessages();
                setMessages(updatedMessages);
            } catch (error) {
                console.error('Failed to send message:', error);
                setError('Failed to send message. Please try again.');
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
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${selectedConversation?.userId === conversation.userId ? 'bg-primary-50 border-primary-200' : ''
                                        }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                            {conversation.user?.name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {conversation.user?.name || 'Unknown User'}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(conversation.latestMessage?.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {conversation.latestMessage?.content || 'No messages yet'}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full mt-1">
                                                    {conversation.unreadCount}
                                                </span>
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
                                        {selectedConversation.user?.name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedConversation.user?.name || 'Unknown User'}
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
                                        disabled={!newMessage.trim()}
                                        className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="h-5 w-5" />
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
            {showNewConversation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Start New Conversation</h2>
                        <p className="text-gray-600 mb-6">
                            This feature will be implemented to allow starting conversations with other users.
                        </p>
                        <button
                            onClick={() => setShowNewConversation(false)}
                            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;