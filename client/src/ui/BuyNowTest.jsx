import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../auth';

export default function BuyNowTest() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBuyNow = async () => {
    try {
      setIsProcessing(true);
      addLog('Starting Buy Now test...');

      // Test product ID that we know exists
      const productId = '68b97e715764bab841dfd187';
      const quantity = 1;

      // Check auth
      const token = localStorage.getItem('token');
      addLog(`Auth token exists: ${!!token}`);

      if (!token) {
        addLog('No token, redirecting to login');
        navigate('/login');
        return;
      }

      // Add to cart
      addLog('Adding to cart...');
      const cartResponse = await API.post('/cart/add', { productId, quantity });
      addLog(`Cart add success: ${JSON.stringify(cartResponse.data)}`);

      // Navigate to checkout
      addLog('Navigating to checkout...');
      navigate('/checkout');
      addLog('Navigation completed');

    } catch (error) {
      addLog(`Error: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Buy Now Test Page</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testBuyNow}
          disabled={isProcessing}
          style={{
            padding: '12px 24px',
            background: isProcessing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isProcessing ? 'Testing...' : 'Test Buy Now'}
        </button>
        
        <button
          onClick={clearLogs}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>

      <div>
        <h3>Test Logs:</h3>
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          padding: '15px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#6c757d' }}>No logs yet. Click "Test Buy Now" to start.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
        <p>This page tests the Buy Now functionality step by step:</p>
        <ol>
          <li>Check authentication token</li>
          <li>Add product to cart via API</li>
          <li>Navigate to checkout page</li>
        </ol>
      </div>
    </div>
  );
}
