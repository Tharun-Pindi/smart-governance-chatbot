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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)' }}>Something went wrong in this section</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {this.state.error?.message || 'Unexpected Error'}
          </p>
          <button 
            className="btn btn-primary mt-4" 
            onClick={() => this.setState({ hasError: false })}
            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
