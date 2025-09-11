import React, { useState } from 'react';
import { MessageSquare, Send, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { messages } from '../../data';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
    const { user } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Get user messages and group by conversation
    const userMessages = messages.filter(m =>
        m.senderId === user.id || m.recipientId === user.id
    );

    // Group messages by conversation
    const conversations = userMessages.reduce((acc, message) => {
        const otherUserId = message.senderId === user.id ? message.recipientId : message.senderId;
        if (!acc[otherUserId]) {
            acc[otherUserId] = [];
        }
        acc[otherUserId].push(message);
        return acc;
    }, {});

    // Get latest message for each conversation
    const conversationList = Object.entries(conversations).map(([userId, msgs]) => {
        const latestMessage = msgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        return {
            userId: parseInt(userId),
            latestMessage,
            messages: msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
            unreadCount: msgs.filter(m => !m.read && m.recipientId === user.id).length
        };
    }).sort((a, b) => new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp));

    const filteredConversations = conversationList.filter(conv =>
        conv.latestMessage.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sendMessage = () => {
        if (newMessage.trim() && selectedConversation) {
            // In a real app, this would send to backend
            console.log('Sending message:', newMessage);
            setNewMessage('');
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
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
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                            <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                            Messages
                        </h1>

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

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map((conversation) => (
                                <button
                                    key={conversation.userId}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${selectedConversation?.userId === conversation.userId ? 'bg-primary-50 border-primary-200' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {conversation.latestMessage.senderName}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 ml-2">
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {conversation.latestMessage.content}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(conversation.latestMessage.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No conversations found</p>
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedConversation.latestMessage.senderName}
                                        </h2>
                                        <p className="text-sm text-gray-500">Online</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                            <Phone className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                            <Video className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedConversation.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === user.id
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <p className={`text-xs mt-1 ${message.senderId === user.id ? 'text-primary-200' : 'text-gray-500'
                                                }`}>
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex space-x-3">
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
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;