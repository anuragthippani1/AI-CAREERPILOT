import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600">
              The app hit an unexpected error. You can refresh the page to recover.
            </p>
            {import.meta.env.DEV && this.state.error?.message && (
              <pre className="mt-4 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto text-gray-800">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


