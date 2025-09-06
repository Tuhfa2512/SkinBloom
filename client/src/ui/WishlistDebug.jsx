import React, { useState, useEffect } from 'react'
import API from '../auth'

export default function WishlistDebug() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wishlistData, setWishlistData] = useState(null)
  const [apiResponse, setApiResponse] = useState('')

  const testWishlistAPI = async () => {
    setLoading(true)
    setError('')
    setApiResponse('')
    
    try {
      console.log('Testing wishlist API...')
      
      const response = await API.get('/wishlist')
      console.log('Wishlist API Response:', response)
      
      setWishlistData(response.data)
      setApiResponse(JSON.stringify(response.data, null, 2))
      
    } catch (err) {
      console.error('Wishlist API Error:', err)
      setError(err.response?.data?.error || err.message || 'Unknown error')
      setApiResponse(JSON.stringify({
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testWishlistAPI()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Wishlist Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testWishlistAPI} disabled={loading}>
          {loading ? 'Testing...' : 'Test Wishlist API'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{
        background: '#f5f5f5',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>API Response:</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          fontSize: '12px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {apiResponse || 'No response yet'}
        </pre>
      </div>

      {wishlistData && (
        <div style={{
          background: '#e8f5e8',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3>Parsed Data:</h3>
          <p><strong>Products count:</strong> {wishlistData.products?.length || 0}</p>
          <p><strong>Created at:</strong> {wishlistData.createdAt || 'N/A'}</p>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h3>Debug Info:</h3>
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        <p><strong>Token present:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
        <p><strong>Token preview:</strong> {localStorage.getItem('token')?.substring(0, 50)}...</p>
      </div>
    </div>
  )
}
