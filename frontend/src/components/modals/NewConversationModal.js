import React, { useState, useEffect } from 'react';
import { X, Search, User, MessageSquare, Send } from 'lucide-react';
import { userService, messageService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const NewConversationModal = ({ isOpen, onClose, onConversationStarted }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [initialMessage, setInitialMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableUsers();
        }
    }, [isOpen]);

    const fetchAvailableUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            // For initial load, show all users by doing a broad search
            const users = await userService.search('', 50); // Get up to 50 users initially
            // Filter out current user
            const filteredUsers = users.filter(u => u.id !== user.id);
            setAvailableUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load available users.');
        } finally {
            setLoading(false);
        }
    };

    // Live search when typing
    useEffect(() => {
        const run = async () => {
            const q = searchTerm.trim();
            try {
                let results;
                if (!q) {
                    // If no search term, show all users (up to 50)
                    results = await userService.search('', 50);
                } else {
                    // Search with the term
                    results = await userService.search(q, 20);
                }
                // Exclude self
                setAvailableUsers(results.filter(u => u.id !== user.id));
            } catch (e) {
                console.error('Search error:', e);
            }
        };
        const id = setTimeout(run, 300);
        return () => clearTimeout(id);
    }, [searchTerm, user?.id]);

    const filteredUsers = availableUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const startConversation = async () => {
        if (!selectedUser || !initialMessage.trim()) return;

        try {
            setSending(true);
            setError(null);

            // Send initial message via API
            await messageService.sendMessage({
                recipientId: selectedUser.id,
                messageText: initialMessage.trim(),
                messageType: 'direct'
            });

            // Optimistic conversation object for local UI update
            const newConversation = {
                userId: selectedUser.id,
                user: selectedUser,
                messages: [
                    {
                        id: Date.now(),
                        content: initialMessage.trim(),
                        createdAt: new Date().toISOString(),
                        sender: { id: user.id, name: `${user.firstName} ${user.lastName}` },
                        recipient: selectedUser,
                        isRead: true
                    }
                ],
                latestMessage: {
                    content: initialMessage.trim(),
                    createdAt: new Date().toISOString()
                },
                unreadCount: 0
            };

            onConversationStarted?.(newConversation);
            onClose();
        } catch (err) {
            console.error('Failed to start conversation:', err);
            setError('Failed to start conversation. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Start New Conversation</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Users List */}
                    <div className="w-1/2 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${user.role === 'student' ? 'tutors' : 'students'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4">
                                    <div className="animate-pulse space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center space-x-3">
                                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${selectedUser?.id === user.id ? 'bg-primary-50 border-primary-200' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                                {user.profileImageUrl ? (
                                                    <img
                                                        src={user.profileImageUrl}
                                                        alt={user.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    user.firstName?.[0] || user.name[0]
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {user.role === 'tutor' ? 'Tutor' : 'Student'}
                                                    {user.rating && ` • ⭐ ${user.rating}`}
                                                </p>
                                                {user.subjects && user.subjects.length > 0 && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {user.subjects.slice(0, 2).join(', ')}
                                                        {user.subjects.length > 2 && ` +${user.subjects.length - 2} more`}
                                                    </p>
                                                )}
                                                {user.totalSessions && (
                                                    <p className="text-xs text-gray-400">
                                                        {user.totalSessions} session{user.totalSessions !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No {user.role === 'student' ? 'tutors' : 'students'} found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Compose */}
                    <div className="w-1/2 flex flex-col">
                        {selectedUser ? (
                            <>
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                            {selectedUser.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedUser.name}</p>
                                            <p className="text-xs text-gray-500">{selectedUser.role === 'tutor' ? 'Tutor' : 'Student'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Initial Message
                                    </label>
                                    <textarea
                                        value={initialMessage}
                                        onChange={(e) => setInitialMessage(e.target.value)}
                                        placeholder={`Send a message to ${selectedUser.name}...`}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                <div className="p-4 border-t border-gray-200">
                                    <button
                                        onClick={startConversation}
                                        disabled={!initialMessage.trim() || sending}
                                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {sending ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Start Conversation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a user</h3>
                                    <p className="text-gray-500">Choose someone to start a conversation with.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewConversationModal;