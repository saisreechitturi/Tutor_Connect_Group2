import React from 'react';
import { X } from 'lucide-react';

/**
 * Simple accessible modal dialog.
 * Props:
 * - isOpen: boolean
 * - title: string
 * - onClose: () => void
 * - primaryAction?: { label: string, onClick: () => void }
 * - secondaryAction?: { label: string, onClick: () => void }
 */
const Modal = ({ isOpen, title, onClose, primaryAction, secondaryAction, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} aria-hidden="true" />

            {/* Dialog */}
            <div
                className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl ring-1 ring-black/5 p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex items-start justify-between">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="ml-3 inline-flex rounded-md p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4 text-gray-700">{children}</div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    {secondaryAction && (
                        <button
                            type="button"
                            onClick={secondaryAction.onClick}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                    {primaryAction && (
                        <button
                            type="button"
                            onClick={primaryAction.onClick}
                            className="btn-primary"
                        >
                            {primaryAction.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
