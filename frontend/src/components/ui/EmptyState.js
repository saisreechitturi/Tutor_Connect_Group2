import React from 'react';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ""
}) => {
    return (
        <div className={`text-center py-12 ${className}`}>
            {Icon && (
                <div className="flex justify-center mb-4">
                    <Icon className="h-16 w-16 text-gray-300" />
                </div>
            )}

            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn-primary"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;