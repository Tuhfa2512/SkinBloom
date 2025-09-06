import React, { useState } from 'react';
import API from '../auth';

export default function EnhancedStripeCheckout({ 
  amount = 50, 
  type = 'consultation',
  buttonText = 'Proceed to Payment',
  buttonStyle = {}
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (type === 'consultation') {
        // Note: server mounts routes under /api/payment (singular)
        response = await API.post('/payment/consultation');
      } else {
        // For product checkout, this would be handled by the Checkout component
        setError('Product checkout should use the Cart -> Checkout flow');
        return;
      }

      const { url } = response.data;

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        setError('Failed to get checkout URL from server.');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError(err.response?.data?.error || 'Failed to start checkout process.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleCheckout} 
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#ccc' : '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          ...buttonStyle
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
        {loading ? 'Processing...' : buttonText}
      </button>
      
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: '#fed7d7',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          color: '#c53030',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
