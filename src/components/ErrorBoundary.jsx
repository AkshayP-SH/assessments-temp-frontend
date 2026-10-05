import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong.</h2>
          <p className="text-sm text-red-600 mb-4">We've encountered an unexpected error in this section of the page.</p>
          {this.state.error && (
            <pre className="p-3 mb-4 bg-red-100 text-red-900 text-xs font-mono rounded overflow-auto max-h-60 whitespace-pre-wrap">
              {this.state.error.toString()}
              {this.state.error.stack && `\n\n${this.state.error.stack}`}
            </pre>
          )}
          <button
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;