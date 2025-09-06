import React, { useState, useEffect } from 'react'
import API from '../auth'

export default function WishlistSafe() {
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Fetching wishlist...')
      
      const response = await API.get('/wishlist')
      console.log('Wishlist response:', response.data)
      
      setWishlist(response.data)
    } catch (err) {
      console.error('Wishlist error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Wishlist...</h2>
        <div>Please wait while we load your wishlist</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Wishlist Error</h2>
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px', 
          padding: '20px',
          color: '#c33',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchWishlist}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Your Wishlist</h2>
        <div style={{ marginBottom: '20px' }}>
          Your wishlist is empty. Start adding products you love!
        </div>
        <button 
          onClick={() => window.location.href = '/products'}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Browse Products
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Your Wishlist ({wishlist.products.length} items)</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {wishlist.products.map((item, index) => {
          const product = item.productId || item.product || item
          
          return (
            <div 
              key={product._id || index}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                background: '#fff'
              }}
            >
              <h3>{product.name || 'Unknown Product'}</h3>
              <p><strong>Price:</strong> ${product.price || 'N/A'}</p>
              {product.description && (
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {product.description.length > 100 
                    ? product.description.substring(0, 100) + '...'
                    : product.description
                  }
                </p>
              )}
              {item.notes && (
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '8px', 
                  borderRadius: '4px',
                  margin: '10px 0'
                }}>
                  <strong>Notes:</strong> {item.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button 
          onClick={fetchWishlist}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Refresh Wishlist
        </button>
        <button 
          onClick={() => window.location.href = '/products'}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add More Products
        </button>
      </div>
    </div>
  )
}
