import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import API from '../auth'

export default function ProductDetailDebug() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [buyingNow, setBuyingNow] = useState(false)
  const [debug, setDebug] = useState([])

  const addDebug = (message) => {
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    if (id) {
      addDebug(`Starting to fetch product with ID: ${id}`)
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      addDebug('Making API call to fetch product...')
      const { data } = await API.get(`/products/${id}`)
      setProduct(data)
      addDebug(`Product fetched successfully: ${data.name}`)
    } catch (err) {
      setError('Product not found')
      addDebug(`Error fetching product: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const buyNow = async () => {
    try {
      setBuyingNow(true)
      addDebug('Buy Now clicked - starting process...')
      
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      addDebug(`Token exists: ${!!token}`)
      
      // First add to cart
      addDebug('Adding product to cart...')
      await API.post('/cart/add', { productId: id, quantity })
      addDebug('Product added to cart successfully')
      
      // Then redirect to checkout
      addDebug('Navigating to checkout...')
      navigate('/checkout')
      addDebug('Navigation called')
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to proceed to checkout'
      addDebug(`Error in buyNow: ${errorMsg}`)
      alert(errorMsg)
    } finally {
      setBuyingNow(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Loading product...</h2>
        <div>
          <h3>Debug Log:</h3>
          {debug.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Product not found</h2>
        <div>
          <h3>Debug Log:</h3>
          {debug.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      <p>In Stock: {product.inStock ? 'Yes' : 'No'}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={buyNow}
          disabled={!product.inStock || buyingNow}
          style={{
            padding: '12px 24px',
            background: buyingNow ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: buyingNow ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {buyingNow ? 'Processing...' : 'Buy Now (Debug)'}
        </button>
        
        <Link to="/checkout" style={{ 
          padding: '12px 24px', 
          background: '#28a745', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Direct to Checkout
        </Link>
      </div>
      
      <div>
        <h3>Debug Log:</h3>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {debug.map((log, i) => <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>{log}</div>)}
        </div>
      </div>
    </div>
  )
}
