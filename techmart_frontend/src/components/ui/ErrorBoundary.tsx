import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center font-sans" style={{ background: 'var(--color-bg-page)' }}>
          <div className="text-center max-w-md px-6">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
              Something went wrong
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="btn-primary px-6 py-2"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
