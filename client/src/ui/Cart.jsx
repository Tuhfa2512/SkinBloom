import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCart(response.data)
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return
    }

    try {
      setUpdating(prev => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem('token')
      
      const response = await axios.put(
        'http://localhost:5000/api/cart/update',
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setCart(response.data)
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }))
    }
  }

  const removeItem = async (productId) => {
    try {
      setUpdating(prev => ({ ...prev, [productId]: true }))
      const token = localStorage.getItem('token')
      
      const response = await axios.delete(
        `http://localhost:5000/api/cart/remove/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setCart(response.data)
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }))
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setCart(response.data)
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading cart...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '18px', color: '#e53e3e' }}>{error}</div>
  <Button onClick={fetchCart} className="blue">Try Again</Button>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#2d3748' }}>
            Your cart is empty
          </h2>
          <p style={{ fontSize: '16px', color: '#718096', marginBottom: '30px' }}>
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3182ce',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748' }}>
          Shopping Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
        </h1>
        
        {cart.items.length > 0 && (
          <Button variant="danger" size="sm" onClick={clearCart}>Clear Cart</Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.items.map(item => (
            <div key={item.productId?._id || item.product?._id} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: '120px 1fr auto',
              gap: '20px',
              alignItems: 'center'
            }}>
              {/* Product Image */}
        <Link to={`/products/${item.productId?._id || item.product?._id}`}> 
                <div style={{
                  width: '120px',
                  height: '120px',
          background: `url(${item.productId?.image || item.product?.image}) center/cover`,
                  backgroundColor: '#f7fafc',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }} />
              </Link>

              {/* Product Details */}
              <div>
                <Link 
                  to={`/products/${item.productId?._id || item.product?._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px'
                  }}>
                    {item.productId?.brand || item.product?.brand}
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#2d3748',
                    lineHeight: '1.3'
                  }}>
                    {item.productId?.name || item.product?.name}
                  </h3>
                </Link>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    background: '#edf2f7',
                    color: '#4a5568',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {item.productId?.category || item.product?.category}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#2d3748'
                  }}>
                    ${(item.price ?? item.productId?.price ?? item.product?.price)?.toFixed(2)}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => updateQuantity(item.productId?._id || item.product?._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating[item.productId?._id || item.product?._id]}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        background: '#f7fafc',
                        cursor: item.quantity > 1 ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                        color: item.quantity > 1 ? '#4a5568' : '#a0aec0'
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      width: '50px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId?._id || item.product?._id, item.quantity + 1)}
                      disabled={updating[item.productId?._id || item.product?._id]}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        background: '#f7fafc',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#4a5568'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#3182ce'
                }}>
                  Subtotal: ${(((item.price ?? item.productId?.price ?? item.product?.price) * item.quantity)).toFixed(2)}
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.productId?._id || item.product?._id)}
                disabled={updating[item.productId?._id || item.product?._id]}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontSize: '20px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#fed7d7'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          height: 'fit-content',
          position: 'sticky',
          top: '20px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#2d3748'
          }}>
            Order Summary
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px'
            }}>
              <span>Subtotal:</span>
              <span>${cart.totalAmount.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px'
            }}>
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px'
            }}>
              <span>Tax:</span>
              <span>Calculated at checkout</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '24px',
            color: '#2d3748'
          }}>
            <span>Total:</span>
            <span>${cart.totalAmount.toFixed(2)}</span>
          </div>

          <Button onClick={() => navigate('/checkout')} className="blue lg" style={{ width: '100%', marginBottom: '12px' }}>
            Proceed to Checkout
          </Button>

          <Link
            to="/products"
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#3182ce',
              border: '1px solid #3182ce',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#3182ce'
              e.target.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = '#3182ce'
            }}
          >
            Continue Shopping
          </Link>

          {/* Trust Badges */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', color: '#718096', textAlign: 'center' }}>
              🔒 Secure Checkout<br />
              🚚 Free Shipping<br />
              ↩️ Easy Returns
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
