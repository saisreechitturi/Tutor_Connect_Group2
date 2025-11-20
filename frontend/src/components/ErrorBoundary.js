import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('AI Chat Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
                    <div className="flex items-center space-x-2 text-red-600 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">AI Chat Error</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                        Something went wrong with the AI chat. Please refresh the page and try again.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;