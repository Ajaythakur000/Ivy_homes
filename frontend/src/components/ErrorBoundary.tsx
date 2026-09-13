'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#15181E] px-6">
          <div className="max-w-md w-full glass-panel p-8 text-center shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-secondary text-sm mb-6">We encountered an unexpected error while rendering this page.</p>
            <button
              className="px-6 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-opacity-90 transition"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
