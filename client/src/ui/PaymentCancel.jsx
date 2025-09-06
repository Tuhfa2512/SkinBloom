import React from 'react';
import { Link } from 'react-router-dom';

function PaymentCancel() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #fed7d7'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>😔</div>
        <h1 style={{ fontSize: '28px', marginBottom: '12px', color: '#e53e3e' }}>
          Payment Cancelled
        </h1>
        <p style={{ fontSize: '16px', color: '#718096', marginBottom: '30px' }}>
          Your payment was cancelled. Don't worry, no charges were made to your account.
        </p>
        
        <div style={{
          background: '#f7fafc',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#2d3748' }}>
            What happened?
          </h3>
          <ul style={{ fontSize: '14px', color: '#4a5568', paddingLeft: '20px', margin: 0 }}>
            <li>You cancelled the payment process</li>
            <li>The payment window was closed</li>
            <li>There was a technical issue with the payment</li>
          </ul>
        </div>

        <div style={{
          background: '#edf2f7',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>💡</div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#2d3748' }}>
            Need Help?
          </h3>
          <p style={{ fontSize: '14px', color: '#4a5568', margin: 0 }}>
            If you're experiencing issues with payment, try using a different payment method
            or contact our support team for assistance.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/cart"
            style={{
              padding: '12px 24px',
              background: '#3182ce',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2c5aa0'}
            onMouseLeave={(e) => e.target.style.background = '#3182ce'}
          >
            Back to Cart
          </Link>
          
          <Link
            to="/products"
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#3182ce',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              border: '1px solid #3182ce',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#3182ce';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#3182ce';
            }}
          >
            Continue Shopping
          </Link>
        </div>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#a0aec0'
        }}>
          Your cart items are still saved and ready for checkout when you're ready.
        </div>
      </div>
    </div>
  );
}

export default PaymentCancel;
