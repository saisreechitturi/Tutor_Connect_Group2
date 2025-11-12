import React, { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle } from 'lucide-react';
import { messageService } from '../services';

const Notifications = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unread, setUnread] = useState([]);
    const [recent, setRecent] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const unreadResp = await messageService.getMessages({ isRead: false, limit: 50 });
            const recentResp = await messageService.getMessages({ limit: 50 });
            setUnread(unreadResp || []);
            setRecent(recentResp || []);
        } catch (e) {
            console.error('Notifications load failed', e);
            setError(e.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const markOneAsRead = async (msg) => {
        try {
            await messageService.markAsRead(msg.id);
            setUnread((prev) => prev.filter((m) => m.id !== msg.id));
            window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: 'Marked as read' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: 'Failed to mark as read' } }));
        }
    };

    const markAllAsRead = async () => {
        try {
            // best-effort: mark per-message to keep it simple
            await Promise.all(unread.map((m) => messageService.markAsRead(m.id)));
            setUnread([]);
            window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: 'All notifications marked as read' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: 'Some items failed to mark' } }));
            load();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-yellow-200 p-6 bg-yellow-50">
                <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-700 mr-2" />
                    <div>
                        <div className="font-medium text-yellow-800">Unable to load notifications</div>
                        <div className="text-sm text-yellow-700 mt-1">{error}</div>
                        <button onClick={load} className="btn-primary mt-3">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    // Derive lightweight categories when backend doesn't provide them
    const categorize = (list) => ({
        messages: list.filter(m => (m.messageType || 'text') !== 'system'),
        system: list.filter(m => (m.messageType || 'text') === 'system')
    });

    const unreadGroups = categorize(unread);
    const recentGroups = categorize(recent);

    const fmt = (d) => new Date(d).toLocaleString();

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Bell className="h-6 w-6 mr-2 text-primary-600" />
                        Notifications
                    </h1>
                    {unread.length > 0 && (
                        <button onClick={markAllAsRead} className="btn-outline text-sm flex items-center">
                            <Check className="h-4 w-4 mr-1" /> Mark all as read
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {unread.length === 0 ? (
                        <div className="text-sm text-gray-600 mb-4">No unread notifications</div>
                    ) : (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-2">Unread</h2>
                            {/* Messages */}
                            {unreadGroups.messages.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Messages</div>
                                    <div className="space-y-2">
                                        {unreadGroups.messages.map((m) => (
                                            <div key={m.id} className="bg-primary-50 border border-primary-200 rounded p-3 flex items-start justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">New message from {m.sender?.firstName || m.sender?.name || 'User'}</div>
                                                    <div className="text-sm text-gray-700 mt-0.5">{m.content}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{fmt(m.createdAt)}</div>
                                                </div>
                                                <button className="btn-outline text-xs" onClick={() => markOneAsRead(m)}>Mark read</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* System */}
                            {unreadGroups.system.length > 0 && (
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">System</div>
                                    <div className="space-y-2">
                                        {unreadGroups.system.map((m) => (
                                            <div key={m.id} className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{m.title || 'System notification'}</div>
                                                    <div className="text-sm text-gray-700 mt-0.5">{m.content}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{fmt(m.createdAt)}</div>
                                                </div>
                                                <button className="btn-outline text-xs" onClick={() => markOneAsRead(m)}>Mark read</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <h2 className="text-sm font-semibold text-gray-800 mb-2">Recent</h2>
                        {/* Recent Messages */}
                        {recentGroups.messages.length > 0 && (
                            <div className="mb-4">
                                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Messages</div>
                                <div className="space-y-2">
                                    {recentGroups.messages.slice(0, 20).map((m) => (
                                        <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                            <div className="text-sm font-medium text-gray-900">{m.sender?.firstName || m.sender?.name || 'User'}</div>
                                            <div className="text-sm text-gray-700 mt-0.5 line-clamp-2">{m.content}</div>
                                            <div className="text-xs text-gray-500 mt-1">{fmt(m.createdAt)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Recent System */}
                        {recentGroups.system.length > 0 && (
                            <div>
                                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">System</div>
                                <div className="space-y-2">
                                    {recentGroups.system.slice(0, 20).map((m) => (
                                        <div key={m.id} className="bg-white border border-gray-200 rounded p-3">
                                            <div className="text-sm font-medium text-gray-900">{m.title || 'System notification'}</div>
                                            <div className="text-sm text-gray-700 mt-0.5 line-clamp-2">{m.content}</div>
                                            <div className="text-xs text-gray-500 mt-1">{fmt(m.createdAt)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
