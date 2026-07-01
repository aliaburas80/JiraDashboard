// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// React error boundary — catches render errors in the component subtree,
// reports them to /api/events/error (P0B-08), and shows a fallback UI.
import React from 'react';
import { reportError } from '@/lib/errorReporter';

interface ErrorBoundaryProps {
  children:   React.ReactNode;
  fallback?:  React.ReactNode;
  component?: string; // label for the error report (e.g. "DashboardPage")
}

interface ErrorBoundaryState {
  hasError: boolean;
  error:    Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Report to structured error monitoring (P0B-08).
    reportError({
      message:   error.message,
      stack:     `${error.stack ?? ''}\n\nComponent stack:\n${info.componentStack ?? ''}`,
      component: this.props.component ?? 'ErrorBoundary',
      severity:  'error',
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 my-4">
          <p className="font-semibold text-red-700 mb-3 text-sm">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 text-white border-none px-4 py-2 cursor-pointer font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
