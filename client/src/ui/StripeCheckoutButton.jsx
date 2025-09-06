import React, { useState } from 'react';
import API from '../auth';
import { useAuth } from './App';

export default function StripeCheckoutButton() {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to book a consultation.');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Server route is mounted at /api/payment (singular)
            const response = await API.post('/payment/consultation');
            const { url } = response.data;

            if (url) {
                // Redirect the user to the Stripe-hosted checkout page
                window.location.href = url;
            } else {
                setError('Failed to get a valid checkout URL from the server.');
            }
        } catch (err) {
            console.error('Stripe checkout error:', err);
            setError(err.response?.data?.error || 'Failed to start the checkout process. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                color: 'white'
            }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
                    Professional Dermatologist Consultation
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                    Get personalized skincare advice from certified dermatologists
                </p>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                    $50.00
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    One-time consultation fee
                </div>
            </div>

            <div style={{
                background: '#f7fafc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left'
            }}>
                <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#2d3748' }}>
                    What's Included:
                </h4>
                <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    display: 'grid',
                    gap: '8px'
                }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#38a169' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#4a5568' }}>
                            30-minute video consultation
                        </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#38a169' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#4a5568' }}>
                            Personalized skincare routine recommendations
                        </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#38a169' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#4a5568' }}>
                            Product recommendations based on your skin type
                        </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#38a169' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#4a5568' }}>
                            Follow-up care instructions
                        </span>
                    </li>
                </ul>
            </div>

            <button 
                onClick={handleCheckout} 
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: loading ? '#a0aec0' : '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                        e.target.style.background = '#2c5aa0';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!loading) {
                        e.target.style.background = '#3182ce';
                    }
                }}
            >
                {loading ? 'Processing...' : '💳 Book Consultation - $50'}
            </button>

            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '16px' }}>
                🔒 Secure payment with Stripe • 💳 All major cards accepted
            </div>

            {error && (
                <div style={{
                    padding: '12px',
                    background: '#fed7d7',
                    border: '1px solid #feb2b2',
                    borderRadius: '8px',
                    color: '#c53030',
                    fontSize: '14px',
                    marginTop: '12px'
                }}>
                    {error}
                </div>
            )}

            {!isAuthenticated && (
                <div style={{
                    padding: '12px',
                    background: '#bee3f8',
                    border: '1px solid #90cdf4',
                    borderRadius: '8px',
                    color: '#2c5aa0',
                    fontSize: '14px',
                    marginTop: '12px'
                }}>
                    ℹ️ Please log in to book a consultation
                </div>
            )}
        </div>
    );
}