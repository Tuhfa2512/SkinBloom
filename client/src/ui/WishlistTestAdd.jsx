import React, { useState } from 'react'
import API from '../auth'

export default function WishlistTestAdd() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addTestProduct = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      // Add a test product to wishlist
      const response = await API.post('/wishlist', {
        productId: '60d5ecb7bc2a1b3a4c8e9876', // Dummy product ID
        notes: 'Test product added via debug tool',
        priceAlertThreshold: 25.99
      })
      
      setMessage('✅ Test product added to wishlist successfully!')
      console.log('Add response:', response.data)
      
    } catch (err) {
      console.error('Add error:', err)
      setMessage('❌ Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      background: '#f0f8ff', 
      padding: '20px', 
      borderRadius: '8px',
      margin: '20px 0' 
    }}>
      <h3>Add Test Product to Wishlist</h3>
      <button 
        onClick={addTestProduct} 
        disabled={loading}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Adding...' : 'Add Test Product'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px',
          borderRadius: '4px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
