import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function LoginScreen({ onLogin, users }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    const keys = ['ocr_tracker_users', 'ocr_tracker_employees', 'ocr_tracker_companies', 'ocr_tracker_vehicles', 'ocr_tracker_properties', 'ocr_doc_categories', 'ocr_field_configs'];
    keys.forEach(key => localStorage.removeItem(key));
    setShowResetConfirm(false);
    window.location.reload();
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError('No account found with that email.');
      return;
    }

    if (user.password !== password) {
      setError('Incorrect password.');
      return;
    }

    onLogin(user);
  };

  // Allows easily clicking demo accounts during dev
  const setDemoCreds = (demoEmail, demoSysRole) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <img src={logoImg} alt="JAMDOCS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Welcome to JAMDOCS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sign in to manage compliance records</p>
        </div>

        {error && (
          <div className="status-badge expired" style={{ display: 'flex', padding: '12px', marginBottom: '1.5rem', justifyContent: 'flex-start', borderRadius: '8px' }}>
            <ShieldAlert size={16} style={{ marginRight: '8px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-glow" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.95rem' }}>
            Sign In <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Demo Accounts (Password: password123)</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              onClick={() => setDemoCreds('john.smith@company.com', 'admin')}
            >
              Admin Demo
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              onClick={() => setDemoCreds('sarah.j@company.com', 'contributor')}
            >
              Contributor Demo
            </button>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            {showResetConfirm ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--status-expired)' }}>Reset all data?</span>
                <button className="btn btn-danger" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={handleResetData}>Yes, Reset</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '4px 8px', opacity: 0.6 }}
                onClick={() => setShowResetConfirm(true)} title="Reset all local data if login is stuck">
                <RefreshCw size={10} style={{ marginRight: '4px' }} /> Reset Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}