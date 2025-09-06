import React, { useEffect, useState } from 'react'
import API from '../auth'

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ 
    product: '', 
    rating: 5, 
    reaction: 'neutral', 
    note: '',
    categories: {
      effectiveness: 5,
      texture: 5,
      scent: 5,
      packaging: 5
    }
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reactionOptions = [
    { value: 'improvement', label: '✨ Skin Improved', color: '#10b981', description: 'Positive changes in skin condition' },
    { value: 'neutral', label: '😐 No Change', color: '#6b7280', description: 'No noticeable difference' },
    { value: 'irritation', label: '⚠️ Irritation', color: '#ef4444', description: 'Caused irritation or negative reaction' },
    { value: 'allergic', label: '🚨 Allergic Reaction', color: '#dc2626', description: 'Severe allergic reaction' }
  ]

  const categoryLabels = {
    effectiveness: '💪 Effectiveness',
    texture: '🤲 Texture & Feel',
    scent: '👃 Scent',
    packaging: '📦 Packaging'
  }

  async function loadData() {
    setLoading(true)
    try {
      const [feedbackRes, productsRes] = await Promise.all([
        API.get('/feedback'),
        API.get('/products?limit=100')
      ])
      
      setFeedbacks(feedbackRes.data || [])
      setProducts(productsRes.data?.products || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveFeedback() {
    if (!form.product) {
      alert('Please select a product')
      return
    }

    setSubmitting(true)
    try {
      await API.post('/feedback', {
        ...form,
        date: new Date().toISOString()
      })
      
      setForm({ 
        product: '', 
        rating: 5, 
        reaction: 'neutral', 
        note: '',
        categories: {
          effectiveness: 5,
          texture: 5,
          scent: 5,
          packaging: 5
        }
      })
      
      await loadData()
      alert('Feedback saved successfully!')
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert('Failed to save feedback')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getReactionOption = (value) => {
    return reactionOptions.find(opt => opt.value === value) || reactionOptions[1]
  }

  const getStarDisplay = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getAverageRating = (categories) => {
    const values = Object.values(categories || {})
    if (values.length === 0) return 0
    return (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Loading feedback data...</p>
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
          Product Reviews & Feedback
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Share your experience and track how products work for your skin
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* New Feedback Form */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          height: 'fit-content'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              Write a Review
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Help others by sharing your honest product experience
            </p>
          </div>

          {/* Product Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Product *
            </label>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">Select a product to review</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} - {product.brand}
                </option>
              ))}
            </select>
          </div>

          {/* Overall Rating */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Overall Rating
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="1"
                max="5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{
                fontSize: '24px',
                color: '#fbbf24',
                minWidth: '120px'
              }}>
                {getStarDisplay(form.rating)}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                minWidth: '30px'
              }}>
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Detailed Ratings
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  background: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    minWidth: '100px'
                  }}>
                    {label}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.categories[key]}
                    onChange={(e) => setForm({
                      ...form,
                      categories: {
                        ...form.categories,
                        [key]: Number(e.target.value)
                      }
                    })}
                    style={{ flex: 1 }}
                  />
                  <span style={{
                    fontSize: '16px',
                    color: '#fbbf24',
                    minWidth: '60px'
                  }}>
                    {getStarDisplay(form.categories[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Skin Reaction */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Skin Reaction
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reactionOptions.map(option => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: `2px solid ${form.reaction === option.value ? option.color : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: form.reaction === option.value ? `${option.color}10` : 'white'
                }}>
                  <input
                    type="radio"
                    name="reaction"
                    value={option.value}
                    checked={form.reaction === option.value}
                    onChange={(e) => setForm({ ...form, reaction: e.target.value })}
                    style={{ marginRight: '12px' }}
                  />
                  <div>
                    <div style={{
                      fontWeight: '500',
                      color: form.reaction === option.value ? option.color : '#374151',
                      marginBottom: '2px'
                    }}>
                      {option.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Review Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Review Details
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Share your detailed experience: How did the product work for you? Would you recommend it? Any tips for other users?"
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
            onClick={saveFeedback}
            disabled={submitting || !form.product}
            style={{
              width: '100%',
              background: submitting || !form.product ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || !form.product ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '⏳ Submitting...' : '📝 Submit Review'}
          </button>
        </div>

        {/* My Reviews */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              My Reviews
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Track your product experiences and ratings
            </p>
          </div>

          {feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1f2937'
              }}>
                No reviews yet
              </h3>
              <p style={{ color: '#6b7280' }}>
                Write your first product review to get started
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {feedbacks.map(feedback => {
                const reaction = getReactionOption(feedback.reaction)
                const product = products.find(p => p._id === feedback.product) || 
                               { name: 'Unknown Product', brand: 'Unknown Brand' }
                
                return (
                  <div
                    key={feedback._id}
                    style={{
                      border: '1px solid #f3f4f6',
                      borderRadius: '12px',
                      padding: '20px',
                      background: '#fafafa'
                    }}
                  >
                    {/* Product Info */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {product.name}
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {product.brand}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {new Date(feedback.date || feedback.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Ratings */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        color: '#fbbf24'
                      }}>
                        {getStarDisplay(feedback.rating || 5)}
                      </div>
                      {feedback.categories && (
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          Avg: {getAverageRating(feedback.categories)}★
                        </span>
                      )}
                    </div>

                    {/* Reaction Badge */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{
                        background: `${reaction.color}20`,
                        color: reaction.color,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {reaction.label}
                      </span>
                    </div>

                    {/* Review Text */}
                    {feedback.note && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: '1.5',
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        "{feedback.note}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
