import React, { useState } from 'react';
import API from '../auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data.user, data.token);
      nav('/auto-redirect');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ 
        maxWidth: 450, 
        width: '100%',
        padding: 40,
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo/Brand */}
        <div style={{marginBottom: 32}}>
          <h1 style={{
            color: 'var(--primary-color)',
            fontSize: '32px',
            marginBottom: '8px'
          }}>
            🌸 SkinBloom
          </h1>
          <p style={{color: 'var(--muted)', fontSize: '16px'}}>
            Welcome back to your skincare journey
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
          <div style={{textAlign: 'left'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Email Address
            </label>
            <input 
              className="input" 
              type="email"
              placeholder='Enter your email' 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{textAlign: 'left'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Password
            </label>
            <input 
              className="input" 
              type='password'
              placeholder='Enter your password' 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button 
            className="btn" 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              background: loading ? 'var(--border-color)' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div style={{ 
              color: '#dc2626', 
              background: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </form>

        <div style={{marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)'}}>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
            Don't have an account?
          </p>
          <Link 
            to='/register'
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Create Account →
          </Link>
        </div>

        <div style={{marginTop: 24}}>
          <Link 
            to="/"
            style={{
              color: 'var(--text-light)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
