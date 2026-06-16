import { Component } from 'react';

import Icon from './Icon';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" className="w-8 h-8 text-danger-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">
              The app encountered an unexpected error. You can try reloading.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="btn-primary w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-outline w-full text-sm"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
