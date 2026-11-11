import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { clearAppData } from '../utils/safeStorage';

/**
 * Last line of defence: without this, any render-time throw unmounts the whole
 * tree and the user gets a permanently blank white page (React logs to the
 * console only). This shows the actual error plus a way out.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      console.error('JamDocs UI error:', error, info?.componentStack);
    } catch {
      // Console unavailable - the fallback UI below is still shown.
    }
  }

  handleReload() {
    window.location.reload();
  }

  handleReset() {
    clearAppData();
    try {
      sessionStorage.clear();
    } catch {
      // Ignore - clearing localStorage is what matters.
    }
    window.location.reload();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error?.message || String(error) || 'Unknown error';

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-primary, #1a1a2e)',
        color: 'var(--text-main, #f2f2f7)'
      }}>
        <div className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={22} style={{ color: 'var(--status-expired, #ff4d6d)' }} />
            <h1 style={{ fontSize: '1.125rem', margin: 0 }}>Something broke while loading JamDocs</h1>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #a0a0b0)', lineHeight: 1.55, marginTop: 0 }}>
            The page could not be rendered, so it was showing up blank. Reload first;
            if it happens again, reset the locally stored data to fall back to the
            seed accounts.
          </p>

          <pre style={{
            fontSize: '0.7rem',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #2c2c44)',
            backgroundColor: 'rgba(0,0,0,0.25)',
            color: 'var(--status-expired, #ff4d6d)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '160px',
            overflow: 'auto'
          }}>{message}</pre>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={this.handleReload}>
              <RefreshCw size={14} /> Reload
            </button>
            <button className="btn btn-danger" onClick={this.handleReset}>
              <Trash2 size={14} /> Reset local data &amp; reload
            </button>
          </div>

          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #6b6b80)', marginBottom: 0, marginTop: '12px' }}>
            Resetting only clears this browser's saved records, accounts and categories.
          </p>
        </div>
      </div>
    );
  }
}
