import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../auth'

// Product Detail Modal Component for Routine
const ProductModal = ({ product, isOpen, onClose, onSelect, isSelected }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [addingToWishlist, setAddingToWishlist] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [myFeedback, setMyFeedback] = useState({ rating: 5, reaction: 'neutral', note: '' })
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false)

  useEffect(() => {
    if (product && user) {
      // Load existing feedback
      loadFeedback()
      checkWishlistStatus()
    }
  }, [product, user])

  const loadFeedback = async () => {
    try {
      const { data } = await API.get('/feedback')
      const mine = (data || []).find(f => (f.product?._id || f.product) === product._id)
      if (mine) {
        setMyFeedback({ rating: mine.rating || 5, reaction: mine.reaction || 'neutral', note: mine.note || '' })
        setHasExistingFeedback(true)
      }
    } catch (e) {
      // Non-blocking
    }
  }

  const checkWishlistStatus = async () => {
    try {
      const { data } = await API.get('/wishlist')
      setIsInWishlist(data.products?.some(item => item.productId._id === product._id) || false)
    } catch (err) {
      // Ignore errors
    }
  }

  const addToCart = async () => {
    try {
      setAddingToCart(true)
      await API.post('/cart/add', { productId: product._id, quantity })
      alert('Product added to cart!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const buyNow = async () => {
    try {
      setBuyingNow(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to continue')
        navigate('/login')
        return
      }
      await API.post('/cart/add', { productId: product._id, quantity })
      await new Promise(resolve => setTimeout(resolve, 100))
      navigate('/checkout')
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please log in to continue')
        navigate('/login')
      } else {
        alert(err.response?.data?.error || 'Failed to proceed to checkout')
      }
    } finally {
      setBuyingNow(false)
    }
  }

  const toggleWishlist = async () => {
    try {
      setAddingToWishlist(true)
      if (isInWishlist) {
        await API.delete(`/wishlist/remove/${product._id}`)
        setIsInWishlist(false)
      } else {
        await API.post('/wishlist/add', { productId: product._id })
        setIsInWishlist(true)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update wishlist')
    } finally {
      setAddingToWishlist(false)
    }
  }

  const submitFeedback = async () => {
    try {
      setFbSubmitting(true)
      await API.post('/feedback', { product: product._id, ...myFeedback })
      setHasExistingFeedback(true)
      alert('Review saved!')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save review')
    } finally {
      setFbSubmitting(false)
    }
  }

  const discountedPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price

  if (!isOpen || !product) {
    return null
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
            fontSize: '24px', cursor: 'pointer', zIndex: 10, color: '#6b7280'
          }}
        >
          ✕
        </button>

        <div style={{ padding: '24px' }}>
          {/* Product Image */}
          <div style={{
            width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden',
            background: product.image ? `url(${product.image}) center/cover` : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
          }}>
            {!product.image && <span style={{ fontSize: '64px', color: '#cbd5e0' }}>📦</span>}
          </div>

          {/* Product Info */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{product.brand}</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>
              {product.name}
            </h2>
            
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{
                    color: star <= Math.floor(product.rating || 0) ? '#ffc107' : '#e0e0e0',
                    fontSize: '16px'
                  }}>⭐</span>
                ))}
              </div>
              <span style={{ fontWeight: '600' }}>{product.rating || 0}</span>
              <span style={{ color: '#6b7280' }}>({product.reviewCount || 0} reviews)</span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#059669' }}>
                ${discountedPrice.toFixed(2)}
              </span>
              {product.discount > 0 && (
                <>
                  <span style={{ fontSize: '18px', color: '#a0aec0', textDecoration: 'line-through' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: '12px', background: '#eab308', color: '#111827',
                    padding: '4px 8px', borderRadius: '999px', fontWeight: '700'
                  }}>
                    -{product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Category & Stock */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                background: '#e5e7eb', color: '#4a5568', padding: '4px 12px',
                borderRadius: '12px', fontSize: '12px', fontWeight: '500'
              }}>
                {product.category}
              </span>
              <span style={{
                background: product.inStock ? '#e8f5e8' : '#fef2f2',
                color: product.inStock ? '#16a34a' : '#dc2626',
                padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
              }}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Quantity Selection */}
          {product.inStock && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Quantity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '32px', height: '32px', border: '1px solid #e5e7eb',
                    background: 'white', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  -
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  style={{
                    width: '32px', height: '32px', border: '1px solid #e5e7eb',
                    background: 'white', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={buyNow}
              disabled={!product.inStock || buyingNow}
              style={{
                flex: 1, fontSize: '14px', fontWeight: '600', padding: '12px',
                background: product.inStock ? '#38a169' : '#ccc',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                color: 'white', border: 'none', borderRadius: '8px'
              }}
            >
              {buyingNow ? 'Processing...' : product.inStock ? 'Buy Now' : 'Out of Stock'}
            </button>

            <button
              onClick={addToCart}
              disabled={!product.inStock || addingToCart}
              style={{
                flex: 1, fontSize: '14px', fontWeight: '600', padding: '12px',
                background: product.inStock ? '#3b82f6' : '#ccc',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                color: 'white', border: 'none', borderRadius: '8px'
              }}
            >
              {addingToCart ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <button
              onClick={toggleWishlist}
              disabled={addingToWishlist}
              style={{
                padding: '12px', background: isInWishlist ? '#fbbf24' : '#f3f4f6',
                color: isInWishlist ? 'white' : '#6b7280',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              {addingToWishlist ? '...' : isInWishlist ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Select for Routine Button */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => { onSelect(); onClose(); }}
              style={{
                width: '100%', fontSize: '16px', fontWeight: '600', padding: '14px',
                background: isSelected ? '#10b981' : '#6366f1',
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              {isSelected ? '✓ Selected for Routine' : 'Select for Routine'}
            </button>
          </div>

          {/* Feedback Section */}
          {user && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Your Review</h3>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Rating</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setMyFeedback(s => ({ ...s, rating: star }))}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: star <= myFeedback.rating ? '#ffc107' : '#e5e7eb',
                          fontSize: '16px'
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <span style={{ fontWeight: '600' }}>{myFeedback.rating}/5</span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { v: 'improvement', label: '✨ Improved' },
                      { v: 'neutral', label: '😐 No change' },
                      { v: 'irritation', label: '⚠️ Irritation' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setMyFeedback(s => ({ ...s, reaction: opt.v }))}
                        style={{
                          border: '1px solid #e5e7eb',
                          background: myFeedback.reaction === opt.v ? '#ecfdf5' : '#fff',
                          color: myFeedback.reaction === opt.v ? '#065f46' : '#374151',
                          padding: '6px 10px', borderRadius: '999px', fontSize: '12px',
                          fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={myFeedback.note}
                  onChange={(e) => setMyFeedback(s => ({ ...s, note: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  rows={3}
                  style={{
                    width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '8px', fontSize: '14px', resize: 'vertical', marginBottom: '12px'
                  }}
                />

                <button
                  onClick={submitFeedback}
                  disabled={fbSubmitting}
                  style={{
                    padding: '8px 16px', background: fbSubmitting ? '#ccc' : '#3b82f6',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: fbSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px'
                  }}
                >
                  {fbSubmitting ? 'Saving...' : hasExistingFeedback ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Routine() {
  const [routine, setRoutine] = useState({ steps: [] })
  const [log, setLog] = useState({ 
    usedSteps: [], 
    notes: '', 
    skinCondition: { redness: 0, dryness: 0, acne: 0 } 
  })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('routine')
  const [products, setProducts] = useState([]) // loaded catalog slice
  const [routineError, setRoutineError] = useState('')
  // Per-step product search state: { [index]: { query, results, open, loading } }
  const [productSearch, setProductSearch] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(null)
  const searchAbortRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load protected data (routine + logs) but don't block products if they 401
      const [routineRes, logsRes] = await Promise.allSettled([
        API.get('/routine'),
        API.get('/routine/log')
      ])

      if (routineRes.status === 'fulfilled') {
        const raw = routineRes.value.data || { steps: [] }
        const enhancedSteps = (raw.steps||[]).map(s => ({
          ...s,
          productName: s.productName || (s.product && typeof s.product === 'object' ? s.product.name : '')
        }))
        setRoutine({ ...raw, steps: enhancedSteps })
      } else {
        console.warn('Routine load skipped or failed:', routineRes.reason?.response?.status)
      }
      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.data || [])
      } else {
        console.warn('Logs load skipped or failed:', logsRes.reason?.response?.status)
      }

      // Always attempt to load products (public endpoint)
      try {
        const productsRes = await API.get('/products?limit=100')
        // listProducts returns { products, pagination } BUT some endpoints may return array
        const pData = productsRes.data
        const prodArray = Array.isArray(pData) ? pData : (pData?.products || [])
        setProducts(prodArray)
      } catch (prodErr) {
        console.error('Products load error:', prodErr?.response?.status, prodErr?.message)
      }
    } catch (error) {
      console.error('Unexpected loadData error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    setRoutine(r => ({
      ...r, 
      steps: [...r.steps, { 
        product: null, 
        productName: '',
        note: '', 
        timeOfDay: 'AM',
        order: r.steps.length + 1
      }]
    }))
  setProductSearch(ps => ({ ...ps, [routine.steps.length]: { query: '', results: [], open: false, loading: false } }))
  }

  const updateStep = (index, key, value) => {
    const steps = [...routine.steps]
    steps[index] = { ...steps[index], [key]: value }
    
    // If product is selected, auto-fill product name
    if (key === 'product' && value) {
      const product = products.find(p => p._id === value)
      if (product) {
        steps[index].productName = product.name
      }
    }
    
    setRoutine({ ...routine, steps })
  }

  // --- Product Search Helpers (Client-side filtering) ---
  const openSearch = (index) => {
    setProductSearch(ps => ({
      ...ps,
      [index]: { ...(ps[index]||{query:'',results:[]}), open: true }
    }))
    // Seed results with first few products if empty
    setProductSearch(ps => {
      const cur = ps[index]
      if (!cur || cur.results?.length === 0) {
        return {
          ...ps,
          [index]: { ...(cur||{query:''}), open: true, results: products.slice(0,15), loading: false }
        }
      }
      return ps
    })
  }

  const closeSearch = (index) => {
    setProductSearch(ps => ({
      ...ps,
      [index]: { ...(ps[index]||{query:'',results:[]}), open: false }
    }))
  }

  const performSearch = async (index, query) => {
    const q = (query || '').trim()
    // Empty -> show initial slice
    if (!q) {
      setProductSearch(ps => ({
        ...ps,
        [index]: { ...(ps[index]||{}), query: '', results: products.slice(0,15), loading: false, open: true }
      }))
      return
    }
    setProductSearch(ps => ({
      ...ps,
      [index]: { ...(ps[index]||{}), query: q, loading: true, open: true }
    }))
    try {
      const { data } = await API.get(`/products?search=${encodeURIComponent(q)}&limit=25`)
      const list = Array.isArray(data) ? data : (data.products || [])
      setProductSearch(ps => ({
        ...ps,
        [index]: { ...(ps[index]||{}), query: q, results: list, loading: false, open: true }
      }))
    } catch (e) {
      console.warn('Search request failed', e?.response?.status)
      // fallback to local filter
      const lower = q.toLowerCase()
      const local = products.filter(p => (p.name||'').toLowerCase().includes(lower)).slice(0,15)
      setProductSearch(ps => ({
        ...ps,
        [index]: { ...(ps[index]||{}), query: q, results: local, loading: false, open: true }
      }))
    }
  }

  // Debounced remote search on typing
  const handleQueryChange = (index, q) => {
    setProductSearch(ps => ({
      ...ps,
      [index]: { ...(ps[index]||{}), query: q, open: true }
    }))
  if (!handleQueryChange._timers) { handleQueryChange._timers = {} }
  if (handleQueryChange._timers[index]) { clearTimeout(handleQueryChange._timers[index]) }
    handleQueryChange._timers[index] = setTimeout(() => performSearch(index, q), 300)
  }

  const selectProduct = (index, product) => {
    updateStep(index, 'product', product._id)
    updateStep(index, 'productName', product.name)
    setProductSearch(ps => ({
      ...ps,
      [index]: { ...(ps[index]||{}), query: product.name, open: false }
    }))
  }

  // Fallback initial search state for existing steps
  useEffect(() => {
    if (routine.steps.length) {
      setProductSearch(ps => {
        const next = { ...ps }
        routine.steps.forEach((_, i) => {
      if (!next[i]) { next[i] = { query: routine.steps[i].productName || '', results: [], open: false, loading: false } }
        })
        return next
      })
    }
  }, [routine.steps.length])

  const ProductSearchSelect = ({ index, step }) => {
    const state = productSearch[index] || { query: step.productName || '', results: [], open: false, loading: false }
    
    const getDiscountedPrice = (product) => {
      return product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price
    }

    const openProductModal = (product) => {
      setSelectedProduct(product)
      setCurrentStepIndex(index)
      setProductModalOpen(true)
      closeSearch(index)
    }
    
    return (
      <div style={{ position: 'relative' }}>
        <label style={{
          display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px'
        }}>Product</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={step.productName || ''}
            placeholder="Search product..."
            onChange={(e) => {
              const q = e.target.value
              // keep the visible text responsive
              updateStep(index, 'productName', q)
              handleQueryChange(index, q)
            }}
            onFocus={() => { openSearch(index); performSearch(index, step.productName || '') }}
            style={{
              flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px'
            }}
          />
          <button
            type="button"
            onClick={() => performSearch(index, step.productName || state.query)}
            style={{
              padding: '10px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontSize: '14px', fontWeight: 500
            }}
          >🔍</button>
        </div>
        {state.open && (state.results.length > 0 || (step.productName || state.query)) && (
          <div style={{
            position: 'absolute', top: '72px', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '8px', maxHeight: '360px', overflowY: 'auto', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}>
            {state.results.length === 0 && (step.productName || state.query) && (
              <div style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>No products found for "{step.productName || state.query}"</div>
            )}
            {state.results.map(p => {
              const discountedPrice = getDiscountedPrice(p)
              return (
                <div
                  key={p._id}
                  style={{
                    padding: '12px', display: 'flex', gap: '12px', alignItems: 'center',
                    borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {/* Product Image */}
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden',
                    background: p.image ? `url(${p.image}) center/cover` : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {!p.image && <span style={{ fontSize: '24px', color: '#cbd5e0' }}>📦</span>}
                  </div>
                  
                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {p.name}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      {p.brand} {p.category && `• ${p.category}`}
                    </div>
                    
                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              color: star <= Math.floor(p.rating || 0) ? '#f59e0b' : '#e5e7eb',
                              fontSize: '10px'
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {p.rating ? `${p.rating}` : 'No rating'} ({p.reviewCount || 0} reviews)
                      </span>
                    </div>
                    
                    {/* Price and Stock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#059669' }}>
                        ${discountedPrice.toFixed(2)}
                      </span>
                      {p.discount > 0 && (
                        <>
                          <span style={{ 
                            fontSize: '11px', color: '#a0aec0', textDecoration: 'line-through' 
                          }}>
                            ${p.price.toFixed(2)}
                          </span>
                          <span style={{
                            fontSize: '9px', background: '#eab308', color: '#111827',
                            padding: '1px 4px', borderRadius: '999px', fontWeight: '700'
                          }}>
                            -{p.discount}%
                          </span>
                        </>
                      )}
                      {!p.inStock && (
                        <span style={{
                          fontSize: '10px', background: '#fef2f2', color: '#dc2626',
                          padding: '2px 6px', borderRadius: '4px', fontWeight: '600'
                        }}>
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => selectProduct(index, p)}
                      onMouseDown={(e) => e.preventDefault()}
                      style={{
                        background: '#3b82f6', color: 'white', padding: '4px 8px',
                        borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      Quick Select
                    </button>
                    <button
                      onClick={() => openProductModal(p)}
                      onMouseDown={(e) => e.preventDefault()}
                      style={{
                        background: '#10b981', color: 'white', padding: '4px 8px',
                        borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )
            })}
            {state.results.length > 0 && (
              <div style={{ 
                padding: '8px 12px', background: '#f9fafb', fontSize: '11px', color: '#9ca3af',
                textAlign: 'center', borderTop: '1px solid #f3f4f6'
              }}>
                {state.results.length} product{state.results.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const removeStep = (index) => {
    const steps = routine.steps.filter((_, i) => i !== index)
    setRoutine({ ...routine, steps })
  }

  const moveStep = (index, direction) => {
    const steps = [...routine.steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]]
      setRoutine({ ...routine, steps })
    }
  }

  const saveRoutine = async () => {
    try {
      await API.post('/routine', {
        steps: routine.steps.map(s => ({ product: s.product, note: s.note, timeOfDay: s.timeOfDay }))
      })
      // Fetch fresh (populated) routine so product names appear
      try {
        const { data: fresh } = await API.get('/routine')
        const enhancedSteps = (fresh?.steps||[]).map(s => ({
          ...s,
          productName: s.productName || (s.product && typeof s.product === 'object' ? s.product.name : '')
        }))
        setRoutine({ ...fresh, steps: enhancedSteps })
      } catch(e){ console.warn('Post-save reload failed', e?.response?.status) }
      alert('Routine saved successfully!')
    } catch (error) {
      console.error('Error saving routine:', error)
      alert('Failed to save routine')
    }
  }

  const saveLog = async () => {
    if (!log.notes.trim() && log.usedSteps.length === 0) {
      alert('Please add some notes or used products')
      return
    }

    try {
  await API.post('/routine/log', {
        ...log,
        date: new Date().toISOString().split('T')[0]
      })
      
      // Reset log form
      setLog({ 
        usedSteps: [], 
        notes: '', 
        skinCondition: { redness: 0, dryness: 0, acne: 0 } 
      })
      
      // Reload logs
  const { data } = await API.get('/routine/log')
      setLogs(data || [])
      
      alert('Daily log saved successfully!')
    } catch (error) {
      console.error('Error saving log:', error?.response?.status, error?.response?.data)
      const msg = error?.response?.data?.error || error?.message || 'Failed to save log'
      alert(`Failed to save log: ${msg}`)
    }
  }

  const timeOfDayOptions = [
    { value: 'AM', label: '🌅 Morning', color: '#fbbf24' },
    { value: 'PM', label: '🌙 Evening', color: '#6366f1' }
  ]

  const getSkinConditionColor = (value) => {
  if (value <= 3) { return '#10b981' }
  if (value <= 6) { return '#f59e0b' }
    return '#ef4444'
  }

  // --- Progress chart helpers (reuse logic from Timeline, but computed from local logs) ---
  const getScoreColor = (score) => {
  if (score >= 8) { return '#10b981'; }
  if (score >= 6) { return '#f59e0b'; }
  if (score >= 4) { return '#f97316'; }
  return '#ef4444';
  }

  // Aggregate logs by calendar day and compute a 0-10 score (higher is better)
  const dailyChartData = React.useMemo(() => {
    if (!logs?.length) { return []; }
    const byDay = new Map();
    logs.forEach((entry) => {
      const d = new Date(entry.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const r = entry?.skinCondition?.redness || 0;
      const dr = entry?.skinCondition?.dryness || 0;
      const a = entry?.skinCondition?.acne || 0;
      // Convert 3-condition 0-10 scales into a single 0-10 score (lower sum -> higher score)
      const score = Math.max(0, Math.min(10, (30 - (r + dr + a)) / 3));
      if (!byDay.has(key)) {
        byDay.set(key, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), scores: [score] });
      } else {
        byDay.get(key).scores.push(score);
      }
    });
    const arr = Array.from(byDay.values()).map((o) => ({
      date: o.date,
      score: o.scores.reduce((s, v) => s + v, 0) / o.scores.length,
    }));
    arr.sort((a, b) => a.date - b.date);
    return arr;
  }, [logs]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Loading your skincare routine...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          Skincare Routine Tracker
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Build your personalized routine and track your skin's progress
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '30px',
        background: '#f3f4f6',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content',
        margin: '0 auto 30px auto'
      }}>
        {[
          { id: 'routine', label: '📋 My Routine', icon: '🧴' },
          { id: 'log', label: '📝 Daily Log', icon: '📊' },
          { id: 'progress', label: '📈 Progress', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1f2937' : '#6b7280',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Routine Builder Tab */}
      {activeTab === 'routine' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Build Your Routine
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={addStep}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                ➕ Add Step
              </button>
              <button
                onClick={saveRoutine}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                💾 Save Routine
              </button>
            </div>
          </div>

          {routine?.steps?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧴</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1f2937'
              }}>
                Start Building Your Routine
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Add products to create your personalized skincare routine
              </p>
              <button
                onClick={addStep}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ➕ Add Your First Product
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {routine.steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '20px',
                    background: '#fafafa'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 200px 1fr auto',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    {/* Product Selection (Searchable) */}
                    <ProductSearchSelect index={index} step={step} />

                    {/* Time of Day */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        When
                      </label>
                      <select
                        value={step.timeOfDay}
                        onChange={(e) => updateStep(index, 'timeOfDay', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        {timeOfDayOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        Notes
                      </label>
                      <input
                        type="text"
                        value={step.note || ''}
                        onChange={(e) => updateStep(index, 'note', e.target.value)}
                        placeholder="Usage notes..."
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        style={{
                          background: index === 0 ? '#f3f4f6' : '#e5e7eb',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === routine.steps.length - 1}
                        style={{
                          background: index === routine.steps.length - 1 ? '#f3f4f6' : '#e5e7eb',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: index === routine.steps.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => removeStep(index)}
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Log Tab */}
      {activeTab === 'log' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '24px'
          }}>
            Today's Log
          </h2>

          {/* Used Products */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Products Used Today
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {routine.steps.map((step, index) => (
                <label
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: log.usedSteps.includes(step.product) ? '#f0f9ff' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={log.usedSteps.includes(step.product)}
                    onChange={(e) => {
                      const usedSteps = e.target.checked
                        ? [...log.usedSteps, step.product]
                        : log.usedSteps.filter(id => id !== step.product)
                      setLog({ ...log, usedSteps })
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    {step.productName || 'Unnamed Product'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Skin Condition */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Skin Condition (0-10 scale)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              {['redness', 'dryness', 'acne'].map(condition => (
                <div key={condition}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {condition}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={log.skinCondition[condition]}
                    onChange={(e) => setLog({
                      ...log,
                      skinCondition: {
                        ...log.skinCondition,
                        [condition]: Number(e.target.value)
                      }
                    })}
                    style={{ width: '100%', marginBottom: '4px' }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: getSkinConditionColor(log.skinCondition[condition])
                  }}>
                    {log.skinCondition[condition]}/10
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Daily Notes
            </label>
            <textarea
              value={log.notes}
              onChange={(e) => setLog({ ...log, notes: e.target.value })}
              placeholder="How did your skin feel today? Any reactions or improvements?"
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={saveLog}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '16px'
            }}
          >
            📝 Save Today's Log
          </button>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '24px'
          }}>
            Your Progress
          </h2>

          {/* Compact progress chart */}
          {logs.length > 0 && (
            <div style={{
              marginBottom: '24px',
              background: '#ffffff',
              border: '1px solid #f3f4f6',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Progress Chart</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Higher is better</div>
              </div>
              <div style={{ position: 'relative', height: '220px', padding: '10px 0 40px 0', overflow: 'hidden' }}>
                {/* Bars */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: dailyChartData.length > 15 ? 'flex-start' : 'center',
                  gap: dailyChartData.length > 30 ? '2px' : dailyChartData.length > 15 ? '4px' : '8px',
                  height: '160px',
                  overflowX: dailyChartData.length > 15 ? 'auto' : 'visible',
                  paddingBottom: '40px'
                }}>
                  {dailyChartData.map((d, idx) => {
                    const h = Math.max((d.score / 10) * 140, 4);
                    const barW = dailyChartData.length > 30 ? '10px' : dailyChartData.length > 15 ? '16px' : '24px';
                    return (
                      <div key={idx} style={{ position: 'relative', minWidth: barW, width: barW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          position: 'absolute',
                          top: `-${h + 18}px`,
                          fontSize: '10px',
                          color: '#374151',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>{d.score.toFixed(1)}</div>
                        <div
                          title={`${new Date(d.date).toLocaleDateString()}: ${d.score.toFixed(1)}/10`}
                          style={{
                            width: '100%',
                            height: `${h}px`,
                            background: getScoreColor(d.score),
                            borderRadius: '4px 4px 0 0',
                            border: '1px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '-34px',
                          fontSize: '9px',
                          color: '#6b7280',
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'center center',
                          whiteSpace: 'nowrap',
                          left: '50%',
                          marginLeft: '-15px',
                          width: '30px',
                          textAlign: 'center'
                        }}>
                          {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Y-axis grid */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '10px', height: '160px', pointerEvents: 'none' }}>
                  {[0, 2, 4, 6, 8, 10].map((val) => (
                    <div key={val} style={{
                      position: 'absolute',
                      bottom: `${(val / 10) * 160}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: val === 0 ? '#e5e7eb' : '#f3f4f6',
                      opacity: 0.6
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1f2937'
              }}>
                No logs yet
              </h3>
              <p style={{ color: '#6b7280' }}>
                Start logging your daily routine to track your progress
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {logs.slice(0, 7).map((logEntry, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#fafafa'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {new Date(logEntry.date).toLocaleDateString()}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['redness', 'dryness', 'acne'].map(condition => (
                        <span
                          key={condition}
                          style={{
                            background: `${getSkinConditionColor(logEntry.skinCondition?.[condition] || 0)}20`,
                            color: getSkinConditionColor(logEntry.skinCondition?.[condition] || 0),
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {condition}: {logEntry.skinCondition?.[condition] || 0}
                        </span>
                      ))}
                    </div>
                  </div>
                  {logEntry.notes && (
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      "{logEntry.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
