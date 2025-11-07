import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
    const getAlertStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    container: 'bg-green-50 border-green-200 text-green-800',
                    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
                    iconBg: 'text-green-400'
                };
            case 'error':
                return {
                    container: 'bg-red-50 border-red-200 text-red-800',
                    icon: <AlertCircle className="h-5 w-5 text-red-400" />,
                    iconBg: 'text-red-400'
                };
            case 'warning':
                return {
                    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                    icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
                    iconBg: 'text-yellow-400'
                };
            default:
                return {
                    container: 'bg-blue-50 border-blue-200 text-blue-800',
                    icon: <Info className="h-5 w-5 text-blue-400" />,
                    iconBg: 'text-blue-400'
                };
        }
    };

    const styles = getAlertStyles(type);

    return (
        <div className={`border rounded-md p-4 ${styles.container} ${className}`} role="alert">
            <div className="flex">
                <div className="flex-shrink-0">
                    {styles.icon}
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium mb-1">
                            {title}
                        </h3>
                    )}
                    <div className="text-sm">
                        {message}
                    </div>
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.iconBg} hover:bg-opacity-20`}
                                onClick={onClose}
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alert;