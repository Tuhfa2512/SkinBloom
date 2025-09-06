import React, { useState } from 'react';
import API from '../auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', { name, email, password: '***', role });
      console.log('API base URL:', API.defaults.baseURL);
      
      const { data } = await API.post('/auth/register', { name, email, password, role });
      console.log('Registration successful:', data);
      
      login(data.user, data.token);
      nav('/auto-redirect');
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err?.response);
      console.error('Error message:', err?.message);
      
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.message) {
        setError(`Connection error: ${err.message}`);
      } else {
        setError('Registration failed - please check your connection');
      }
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
        maxWidth: 500, 
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
            Start your personalized skincare journey today
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
              Full Name
            </label>
            <input 
              className="input" 
              type="text"
              placeholder='Enter your full name' 
              value={name} 
              onChange={e => setName(e.target.value)}
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
              marginBottom: '12px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Account Type
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                border: `2px solid ${role === 'user' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: role === 'user' ? 'rgba(139, 69, 19, 0.05)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={e => setRole(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>👤 User</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Get personalized skincare
                  </div>
                </div>
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                border: `2px solid ${role === 'dermatologist' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: role === 'dermatologist' ? 'rgba(139, 69, 19, 0.05)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="dermatologist"
                  checked={role === 'dermatologist'}
                  onChange={e => setRole(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>👨‍⚕️ Dermatologist</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Provide expert care
                  </div>
                </div>
              </label>
            </div>
          </div>

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
              placeholder='Create a password (min. 6 characters)' 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
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
              Confirm Password
            </label>
            <input 
              className="input" 
              type='password'
              placeholder='Confirm your password' 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
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

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'left',
            fontSize: '14px',
            color: '#166534'
          }}>
            <p style={{margin: 0, fontWeight: '600', marginBottom: '8px'}}>
              ✨ {role === 'dermatologist' ? "What you'll provide:" : "What you'll get:"}
            </p>
            <ul style={{margin: 0, paddingLeft: '16px'}}>
              {role === 'dermatologist' ? (
                <>
                  <li>Manage patient consultations and tickets</li>
                  <li>Provide expert skincare recommendations</li>
                  <li>Access professional dashboard and analytics</li>
                  <li>Connect with clients seeking dermatological advice</li>
                </>
              ) : (
                <>
                  <li>Personalized skincare routine recommendations</li>
                  <li>AI-powered skin analysis and tracking</li>
                  <li>Access to expert-curated product catalog</li>
                  <li>Progress monitoring with photo timeline</li>
                </>
              )}
            </ul>
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
            {loading ? 'Creating Account...' : 'Create My Account'}
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

          <p style={{
            fontSize: '12px',
            color: 'var(--text-light)',
            lineHeight: '1.5',
            margin: 0
          }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <div style={{marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)'}}>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
            Already have an account?
          </p>
          <Link 
            to='/login'
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Sign In →
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
