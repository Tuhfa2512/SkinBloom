import React, { useState, useEffect } from 'react'
import axios from 'axios'

function CartDebugPage() {
  const [debugInfo, setDebugInfo] = useState({
    token: null,
    cartData: null,
    error: null,
    loading: true,
    apiCalls: []
  })

  const addLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, { timestamp, message, data }]
    }))
  }

  useEffect(() => {
    debugCart()
  }, [])

  const debugCart = async () => {
    try {
      addLog('Starting cart debug...')
      
      // Check token
      const token = localStorage.getItem('token')
      addLog(`Token exists: ${!!token}`, token ? 'Token found' : 'No token')
      
      if (!token) {
        setDebugInfo(prev => ({
          ...prev,
          error: 'No authentication token found',
          loading: false
        }))
        return
      }

      setDebugInfo(prev => ({ ...prev, token }))

      // Test cart API
      addLog('Making cart API call...')
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })

      addLog('Cart API response received', {
        status: response.status,
        dataKeys: Object.keys(response.data),
        itemsCount: response.data.items?.length || 0
      })

      setDebugInfo(prev => ({
        ...prev,
        cartData: response.data,
        loading: false
      }))

    } catch (error) {
      addLog('Cart API error', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })

      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }

  const clearCart = async () => {
    try {
      addLog('Clearing cart...')
      const token = localStorage.getItem('token')
      await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: { Authorization: `Bearer ${token}` }
      })
      addLog('Cart cleared successfully')
      debugCart() // Refresh
    } catch (error) {
      addLog('Error clearing cart', error.message)
    }
  }

  const addTestItem = async () => {
    try {
      addLog('Adding test item to cart...')
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:5000/api/cart/add', 
        { productId: '68b97e715764bab841dfd187', quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addLog('Test item added', response.data)
      debugCart() // Refresh
    } catch (error) {
      addLog('Error adding test item', error.message)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Cart Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={debugCart} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Refresh Debug
        </button>
        <button onClick={addTestItem} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Add Test Item
        </button>
        <button onClick={clearCart} style={{ padding: '8px 16px' }}>
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Status Panel */}
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Current Status</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Loading:</strong> {debugInfo.loading ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Token:</strong> {debugInfo.token ? 'Present' : 'Missing'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Error:</strong> {debugInfo.error || 'None'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Cart Items:</strong> {debugInfo.cartData?.items?.length || 0}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Amount:</strong> ${debugInfo.cartData?.totalAmount?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Cart Data Panel */}
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Cart Data</h3>
          <pre style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(debugInfo.cartData, null, 2)}
          </pre>
        </div>
      </div>

      {/* API Calls Log */}
      <div style={{ marginTop: '20px' }}>
        <h3>API Calls Log</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {debugInfo.apiCalls.map((call, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '8px',
              background: 'white',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                [{call.timestamp}] {call.message}
              </div>
              {call.data && (
                <pre style={{ margin: '5px 0 0 0', color: '#666' }}>
                  {typeof call.data === 'string' ? call.data : JSON.stringify(call.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#e9ecef', borderRadius: '8px' }}>
        <h3>Instructions</h3>
        <ol style={{ fontSize: '14px' }}>
          <li>This page helps debug cart loading issues</li>
          <li>Check if token exists and API calls are successful</li>
          <li>Use "Add Test Item" to add a product to cart</li>
          <li>Check the cart data structure and API logs</li>
          <li>If cart works here but not on main cart page, it's a rendering issue</li>
        </ol>
      </div>
    </div>
  )
}

export default CartDebugPage
