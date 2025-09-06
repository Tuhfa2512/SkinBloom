import React, { useState, useEffect } from 'react'
import API from '../auth'
import { Link } from 'react-router-dom'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState({ products: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/wishlist')
      setWishlist(data)
    } catch (err) {
      setError('Failed to load wishlist')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await API.delete(`/wishlist/remove/${productId}`)
      setWishlist(data)
    } catch (err) {
      console.error('Error removing from wishlist:', err)
    }
  }

  const updatePriceAlert = async (productId, enabled, targetPrice) => {
    try {
      const { data } = await API.put(`/wishlist/update/${productId}`, {
        priceAlert: { enabled, targetPrice: enabled ? targetPrice : undefined }
      })
      setWishlist(data)
    } catch (err) {
      console.error('Error updating price alert:', err)
    }
  }

  const updateNotes = async (productId, notes) => {
    try {
      const { data } = await API.put(`/wishlist/update/${productId}`, { notes })
      setWishlist(data)
    } catch (err) {
      console.error('Error updating notes:', err)
    }
  }

  const clearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) return
    
    try {
      await API.delete('/wishlist/clear')
      setWishlist({ products: [] })
    } catch (err) {
      console.error('Error clearing wishlist:', err)
    }
  }

  const validProducts = wishlist.products.filter(item => item.productId && item.productId._id)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', color: 'var(--muted)' }}>
          Loading your wishlist...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>
          ❤️ My Wishlist
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Save your favorite products and get notified when prices drop
        </p>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {validProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>💔</div>
            <h2 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>
              Your wishlist is empty
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '16px' }}>
              Start building your perfect skincare collection by adding products to your wishlist
            </p>
            <Link to="/products" className="btn" style={{ textDecoration: 'none' }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              padding: '0 4px'
            }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-color)' }}>
                  {validProducts.length} Item{validProducts.length !== 1 ? 's' : ''}
                </h2>
                <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>
                  Added on {new Date(wishlist.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button className="btn secondary" onClick={clearWishlist}>
                Clear All
              </button>
            </div>

            {/* Wishlist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {validProducts.map(item => (
                <WishlistItem
                  key={item.productId._id}
                  item={item}
                  onRemove={() => removeFromWishlist(item.productId._id)}
                  onUpdatePriceAlert={(enabled, targetPrice) => 
                    updatePriceAlert(item.productId._id, enabled, targetPrice)
                  }
                  onUpdateNotes={(notes) => updateNotes(item.productId._id, notes)}
                />
              ))}
            </div>

            {/* Continue Shopping */}
            <div style={{
              textAlign: 'center',
              marginTop: '60px',
              padding: '40px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '16px' }}>Keep Exploring</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                Discover more products to complete your skincare routine
              </p>
              <Link 
                to="/products" 
                className="btn" 
                style={{ 
                  textDecoration: 'none',
                  display: 'inline-block',
                  background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                  transition: 'transform .15s ease, box-shadow .15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.25)';
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function WishlistItem({ item, onRemove, onUpdatePriceAlert, onUpdateNotes }) {
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [targetPrice, setTargetPrice] = useState(item.priceAlert?.targetPrice || '')
  const [notes, setNotes] = useState(item.notes || '')
  const [editingNotes, setEditingNotes] = useState(false)

  const product = item.productId || { name: 'Product no longer available', price: 0, brand: '', image: '' }

  const handlePriceAlertToggle = () => {
    const enabled = !item.priceAlert?.enabled
    if (enabled && targetPrice) {
      onUpdatePriceAlert(enabled, parseFloat(targetPrice))
    } else if (!enabled) {
      onUpdatePriceAlert(false)
    }
  }

  const handlePriceAlertSave = () => {
    if (targetPrice && parseFloat(targetPrice) > 0) {
      onUpdatePriceAlert(true, parseFloat(targetPrice))
      setShowPriceAlert(false)
    }
  }

  const handleNotesSave = () => {
    onUpdateNotes(notes)
    setEditingNotes(false)
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr auto',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Product Image */}
        <div style={{
          width: '120px',
          height: '120px',
          background: `url(${product.image}) center/cover`,
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }} />

        {/* Product Details */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {product.brand}
            </div>
            <h3 style={{ fontSize: '18px', margin: '4px 0', color: 'var(--text-color)' }}>
              {product.name}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'var(--primary-light)',
              color: 'var(--primary-color)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {product.category}
            </span>
            {product.skinType.slice(0, 2).map(type => (
              <span key={type} style={{
                background: '#e8f5e8',
                color: '#2d5016',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {type}
              </span>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#ffc107' }}>⭐</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{product.rating}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
              ${product.price}
            </div>
          </div>

          {/* Price Alert */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={item.priceAlert?.enabled || false}
                onChange={handlePriceAlertToggle}
                style={{ marginRight: '4px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Price Alert</span>
              {!item.priceAlert?.enabled && (
                <button
                  onClick={() => setShowPriceAlert(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Set Target
                </button>
              )}
            </div>

            {item.priceAlert?.enabled && (
              <div style={{
                background: '#e8f5e8',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#2d5016'
              }}>
                🔔 Alert when price drops below ${item.priceAlert.targetPrice}
              </div>
            )}

            {showPriceAlert && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <input
                  type="number"
                  placeholder="Target price"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    width: '100px',
                    fontSize: '13px'
                  }}
                />
                <button onClick={handlePriceAlertSave} className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Save
                </button>
                <button
                  onClick={() => setShowPriceAlert(false)}
                  className="btn secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Notes
            </div>
            {editingNotes ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add personal notes about this product..."
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={handleNotesSave} className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotes(false)
                      setNotes(item.notes || '')
                    }}
                    className="btn secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNotes(true)}
                style={{
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  minHeight: '40px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: notes ? 'var(--text-color)' : 'var(--muted)',
                  background: notes ? 'white' : '#f9f9f9'
                }}
              >
                {notes || 'Click to add notes...'}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'end' }}>
          <button
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              color: '#dc2626'
            }}
            title="Remove from wishlist"
          >
            ❌
          </button>
          
          <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
            Added {new Date(item.addedAt).toLocaleDateString()}
          </div>

          <button className="btn" style={{ fontSize: '14px', marginTop: '8px' }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
