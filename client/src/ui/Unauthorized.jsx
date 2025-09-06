import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ 
        maxWidth: 500, 
        width: '100%',
        padding: 40,
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '16px'
        }}>
          🚫
        </div>
        
        <h1 style={{
          color: 'var(--text-color)',
          fontSize: '24px',
          marginBottom: '16px'
        }}>
          Access Denied
        </h1>
        
        <p style={{
          color: 'var(--muted)',
          fontSize: '16px',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          You don't have permission to access this page. Your current role is <strong>{user?.role || 'unknown'}</strong>.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Go Home
          </Link>
          
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'var(--text-color)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
