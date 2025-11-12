import React, { useEffect, useState, useCallback } from 'react';

const Toaster = () => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const handler = (e) => {
            const { type = 'info', title, message, duration = 3500 } = e.detail || {};
            const id = Date.now() + Math.random();
            const toast = { id, type, title, message };
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => removeToast(id), duration);
        };

        window.addEventListener('toast', handler);
        return () => window.removeEventListener('toast', handler);
    }, [removeToast]);

    if (toasts.length === 0) return null;

    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    return (
        <div className="fixed top-4 right-4 z-[60] space-y-2">
            {toasts.map((t) => (
                <div key={t.id} className={`max-w-sm w-80 border rounded-lg shadow-sm p-3 ${typeStyles[t.type] || typeStyles.info}`}>
                    {t.title && <div className="font-semibold text-sm">{t.title}</div>}
                    {t.message && <div className="text-sm mt-0.5">{t.message}</div>}
                    <button
                        onClick={() => removeToast(t.id)}
                        className="absolute top-2 right-2 text-xs opacity-70 hover:opacity-100"
                        aria-label="Dismiss notification"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toaster;
