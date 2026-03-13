import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" role="alert" aria-live="assertive">
          <div className="max-w-lg w-full glass-card border border-white/10 rounded-xl p-6">
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-white/70">
              The app hit an unexpected error. You can refresh the page to recover.
            </p>
            {import.meta.env.DEV && (
              <p className="mt-1 text-xs text-white/50">
                Error details have been logged to the console for debugging.
              </p>
            )}
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-xs bg-black/20 border border-white/10 rounded-lg p-3 overflow-auto text-white/80">
                {this.state.error.name ? `${this.state.error.name}: ` : ''}
                {this.state.error.message}
                {this.state.errorInfo?.componentStack ? `\n\n${this.state.errorInfo.componentStack}` : ''}
              </pre>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-500 transition-colors cp-focus-ring"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-white/5 text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors border border-white/10 cp-focus-ring"
              >
                Try again
              </button>
              <a
                href="/"
                className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white underline-offset-4 hover:underline cp-focus-ring"
              >
                Go back home
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (!this.props.children) {
      return null;
    }

    return this.props.children;
  }
}

