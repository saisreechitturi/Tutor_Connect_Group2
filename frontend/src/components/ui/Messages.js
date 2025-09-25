import React, { useState } from 'react';
import { MessageSquare, Send, Search, MoreVertical, Phone, Video, Plus, Users, X } from 'lucide-react';
import { messages, users } from '../../data';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
    const { user } = useAuth();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'contacts'

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
        const otherUser = users.find(u => u.id === parseInt(userId));
        return {
            userId: parseInt(userId),
            user: otherUser,
            latestMessage,
            messages: msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
            unreadCount: msgs.filter(m => !m.read && m.recipientId === user.id).length
        };
    }).sort((a, b) => new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp));

    // Get potential contacts (users who can be messaged)
    const potentialContacts = users.filter(u =>
        u.id !== user.id &&
        !conversationList.some(conv => conv.userId === u.id)
    );

    // Filter based on search term and active tab
    const filteredConversations = conversationList.filter(conv =>
        conv.user?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredContacts = potentialContacts.filter(contact =>
        contact.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sendMessage = () => {
        if (newMessage.trim() && selectedConversation) {
            // In a real app, this would send to backend
            console.log('Sending message:', newMessage);
            setNewMessage('');
        }
    };

    const startNewConversation = (contact) => {
        // Create a new conversation mock
        const newConversation = {
            userId: contact.id,
            user: contact,
            latestMessage: {
                id: Date.now(),
                senderId: user.id,
                content: 'Conversation started',
                timestamp: new Date().toISOString(),
                type: 'text'
            },
            messages: [],
            unreadCount: 0
        };
        setSelectedConversation(newConversation);
        setShowNewConversation(false);
        setActiveTab('conversations');
    };

    const getOnlineStatus = (userId) => {
        // Mock online status - in real app, this would come from backend
        const onlineUsers = [2, 4, 5]; // Mock some users as online
        return onlineUsers.includes(userId);
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] flex">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-gray-900 flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                                Messages
                            </h1>
                            <button
                                onClick={() => setShowNewConversation(true)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Start new conversation"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('conversations')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'conversations'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <MessageSquare className="h-4 w-4 inline mr-1" />
                                Chats
                            </button>
                            <button
                                onClick={() => setActiveTab('contacts')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'contacts'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Users className="h-4 w-4 inline mr-1" />
                                Contacts
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'conversations' ? (
                            filteredConversations.length > 0 ? (
                                filteredConversations.map((conversation) => (
                                    <button
                                        key={conversation.userId}
                                        onClick={() => setSelectedConversation(conversation)}
                                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${selectedConversation?.userId === conversation.userId ? 'bg-primary-50 border-primary-200' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {conversation.user?.profile?.avatar ? (
                                                        <img
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={conversation.user.profile.avatar}
                                                            alt={conversation.user.profile.firstName}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                                        style={{ display: conversation.user?.profile?.avatar ? 'none' : 'flex' }}
                                                    >
                                                        {conversation.user?.profile?.firstName?.[0]}{conversation.user?.profile?.lastName?.[0]}
                                                    </div>
                                                </div>
                                                {getOnlineStatus(conversation.userId) && (
                                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {conversation.user?.profile?.firstName} {conversation.user?.profile?.lastName}
                                                        </p>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${conversation.user?.role === 'tutor' ? 'bg-blue-100 text-blue-700' :
                                                                conversation.user?.role === 'student' ? 'bg-green-100 text-green-700' :
                                                                    'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {conversation.user?.role}
                                                        </span>
                                                    </div>
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
                                    <p className="text-xs mt-1">Start a new conversation from the Contacts tab</p>
                                </div>
                            )
                        ) : (
                            /* Contacts Tab */
                            filteredContacts.length > 0 ? (
                                filteredContacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => startNewConversation(contact)}
                                        className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {contact.profile?.avatar ? (
                                                        <img
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={contact.profile.avatar}
                                                            alt={contact.profile.firstName}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                                        style={{ display: contact.profile?.avatar ? 'none' : 'flex' }}
                                                    >
                                                        {contact.profile?.firstName?.[0]}{contact.profile?.lastName?.[0]}
                                                    </div>
                                                </div>
                                                {getOnlineStatus(contact.id) && (
                                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {contact.profile?.firstName} {contact.profile?.lastName}
                                                    </p>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${contact.role === 'tutor' ? 'bg-blue-100 text-blue-700' :
                                                            contact.role === 'student' ? 'bg-green-100 text-green-700' :
                                                                'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {contact.role}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {contact.profile?.bio || 'No bio available'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {contact.profile?.location}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p>No contacts found</p>
                                    <p className="text-xs mt-1">All available users are already in your conversations</p>
                                </div>
                            )
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
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {selectedConversation.user?.profile?.avatar ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={selectedConversation.user.profile.avatar}
                                                        alt={selectedConversation.user.profile.firstName}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                                    style={{ display: selectedConversation.user?.profile?.avatar ? 'none' : 'flex' }}
                                                >
                                                    {selectedConversation.user?.profile?.firstName?.[0]}{selectedConversation.user?.profile?.lastName?.[0]}
                                                </div>
                                            </div>
                                            {getOnlineStatus(selectedConversation.userId) && (
                                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {selectedConversation.user?.profile?.firstName} {selectedConversation.user?.profile?.lastName}
                                            </h2>
                                            <p className="text-sm text-gray-500 flex items-center space-x-2">
                                                <span className={`inline-block w-2 h-2 rounded-full ${getOnlineStatus(selectedConversation.userId) ? 'bg-green-400' : 'bg-gray-400'
                                                    }`}></span>
                                                <span>{getOnlineStatus(selectedConversation.userId) ? 'Online' : 'Offline'}</span>
                                                <span>•</span>
                                                <span className="capitalize">{selectedConversation.user?.role}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Voice call">
                                            <Phone className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Video call">
                                            <Video className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="More options">
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
                                <p className="text-sm mb-4">Choose a conversation from the sidebar to start messaging</p>
                                <button
                                    onClick={() => {
                                        setActiveTab('contacts');
                                        setShowNewConversation(true);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Start New Conversation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Start New Conversation</h3>
                            <button
                                onClick={() => setShowNewConversation(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => startNewConversation(contact)}
                                    className="w-full p-3 hover:bg-gray-50 text-left rounded-md transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {contact.profile?.avatar ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={contact.profile.avatar}
                                                        alt={contact.profile.firstName}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                                                    style={{ display: contact.profile?.avatar ? 'none' : 'flex' }}
                                                >
                                                    {contact.profile?.firstName?.[0]}{contact.profile?.lastName?.[0]}
                                                </div>
                                            </div>
                                            {getOnlineStatus(contact.id) && (
                                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {contact.profile?.firstName} {contact.profile?.lastName}
                                                </p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${contact.role === 'tutor' ? 'bg-blue-100 text-blue-700' :
                                                        contact.role === 'student' ? 'bg-green-100 text-green-700' :
                                                            'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {contact.role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {contact.profile?.location}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filteredContacts.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No contacts available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;