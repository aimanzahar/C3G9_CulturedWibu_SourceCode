"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isConvexError: boolean;
}

export class ConvexErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isConvexError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isConvexError =
      error.message.includes("CONVEX") ||
      error.message.includes("Could not find public function") ||
      error.message.includes("convex") ||
      error.message.includes("Server Error");

    return { hasError: true, error, isConvexError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ConvexErrorBoundary] Caught error:", error);
    console.error("[ConvexErrorBoundary] Error info:", errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isConvexError: false });
  };

  handleHardRefresh = () => {
    // Clear any cached state and do a hard refresh
    if (typeof window !== "undefined") {
      localStorage.removeItem("air-session-token");
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isConvexError) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                Connection Issue
              </h1>

              <p className="text-slate-400 mb-6">
                We&apos;re having trouble connecting to our servers. This is
                usually temporary. Please try refreshing the page.
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleHardRefresh}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
                >
                  Refresh Page
                </button>

                <button
                  onClick={this.handleRetry}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>

              <details className="mt-6 text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error?.message}
                </pre>
              </details>
            </div>
          </div>
        );
      }

      // Non-Convex error - show generic error
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Something Went Wrong
            </h1>

            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>

            <button
              onClick={this.handleHardRefresh}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              Refresh Page
            </button>

            <details className="mt-6 text-left">
              <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ConvexErrorBoundary;

