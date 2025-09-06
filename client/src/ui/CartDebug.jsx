import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CartDebug() {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    testCart();
  }, []);

  const testCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Cart API Response:', response.data);
      setCartData(response.data);
    } catch (error) {
      console.error('Cart API Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Cart Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testCart} style={{ padding: '10px 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '5px' }}>
          Reload Cart
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {cartData && (
        <div>
          <h2>Cart Data:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(cartData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default CartDebug;
