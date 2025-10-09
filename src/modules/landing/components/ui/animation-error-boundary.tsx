'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AnimationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AnimationErrorBoundary] Animation error caught:', error, errorInfo);
    
    // You can send this to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when animation fails
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#020618] text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
              <p className="text-lg opacity-80">
                We're experiencing some technical difficulties. Please refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}