import React from 'react';

interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#091d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ background: '#0d2540', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 16, padding: 32, maxWidth: 700, width: '100%' }}>
            <h2 style={{ color: '#ff6b6b', fontFamily: 'monospace', marginBottom: 16, fontSize: 18 }}>Runtime Error — Lumina</h2>
            <pre style={{ color: '#8daba8', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {this.state.error}
            </pre>
            <button onClick={() => window.location.reload()}
              style={{ marginTop: 24, padding: '8px 20px', background: '#4ecdc4', color: '#091d2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
