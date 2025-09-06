import React, { useEffect, useState } from 'react'
import API from '../auth'

export default function Tickets() {
  const [tickets, setTickets] = useState([])
  const [concern, setConcern] = useState('')
  const [skinType, setSkinType] = useState('')
  const [urgency, setUrgency] = useState('low')
  const [symptoms, setSymptoms] = useState('')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(null)

  const urgencyOptions = [
    { value: 'low', label: 'Low - General consultation', color: '#10b981' },
    { value: 'medium', label: 'Medium - Moderate concern', color: '#f59e0b' },
    { value: 'high', label: 'High - Urgent skin issue', color: '#ef4444' }
  ]

  const skinTypeOptions = [
    'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'Acne-prone'
  ]

  async function loadTickets() {
    setLoading(true)
    try {
      const { data } = await API.get('/tickets/my-tickets')
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      alert('Maximum 5 photos allowed')
      return
    }
    setPhotos(files)
  }

  async function submitTicket() {
    if (!concern.trim()) {
      alert('Please describe your skin concern')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('concern', concern.trim())
      formData.append('skinType', skinType)
      formData.append('urgency', urgency)
      formData.append('symptoms', symptoms.trim())
      
      photos.forEach(photo => {
        formData.append('photos', photo)
      })

      await API.post('/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setConcern('')
      setSkinType('')
      setUrgency('low')
      setSymptoms('')
      setPhotos([])
      document.getElementById('photoInput').value = ''
      await loadTickets()
      alert('Your consultation request has been submitted successfully!')
    } catch (error) {
      console.error('Error submitting ticket:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function processPayment(ticketId) {
    setProcessingPayment(ticketId)
    try {
      const { data } = await API.post(`/tickets/${ticketId}/payment`, {
        amount: 5000 // $50 consultation fee
      })
      
      if (data.url) {
        window.open(data.url, '_blank')
      }
      
      await loadTickets()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Failed to process payment. Please try again.')
    } finally {
      setProcessingPayment(null)
    }
  }

  async function downloadPDF(ticketId, type) {
    try {
      const endpoint = type === 'consultation' 
        ? `/tickets/${ticketId}/consultation-pdf`
        : `/tickets/${ticketId}/payment-receipt-pdf`
      
      const response = await API.get(endpoint, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b'
      case 'assigned': return '#3b82f6'
      case 'in-consultation': return '#8b5cf6'
      case 'consultation-provided': return '#10b981'
      case 'payment-pending': return '#f97316'
      case 'resolved': return '#059669'
      case 'closed': return '#6b7280'
      default: return '#f59e0b'
    }
  }

  const getUrgencyColor = (urgencyLevel) => {
    const option = urgencyOptions.find(opt => opt.value === urgencyLevel)
    return option ? option.color : '#6b7280'
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
          Professional Skincare Consultation
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Get expert advice from certified dermatologists and skincare professionals
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* New Consultation Form */}
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
              Request New Consultation
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Describe your skin concerns and upload photos for professional advice
            </p>
          </div>

          {/* Skin Type Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Skin Type
            </label>
            <select
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">Select your skin type</option>
              {skinTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Urgency Level */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Urgency Level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgencyOptions.map(option => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: `2px solid ${urgency === option.value ? option.color : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: urgency === option.value ? `${option.color}10` : 'white'
                }}>
                  <input
                    type="radio"
                    name="urgency"
                    value={option.value}
                    checked={urgency === option.value}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{
                    fontWeight: '500',
                    color: urgency === option.value ? option.color : '#374151'
                  }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Upload Photos (Optional, max 5)
            </label>
            <input
              id="photoInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            {photos.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                {photos.length} photo(s) selected
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Symptoms (Optional)
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="List any symptoms like itching, burning, pain, etc."
              rows="3"
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

          {/* Concern Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Describe Your Concern
            </label>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Please describe your skin concern in detail. Include duration, products you've tried, and any other relevant information..."
              rows="6"
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
            onClick={submitTicket}
            disabled={submitting || !concern.trim()}
            style={{
              width: '100%',
              background: submitting || !concern.trim() ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || !concern.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '⏳ Submitting...' : '📤 Submit Consultation Request'}
          </button>
        </div>

        {/* My Consultations */}
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
              My Consultations
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Track your consultation requests and responses
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: '#6b7280' }}>Loading consultations...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1f2937'
              }}>
                No consultations yet
              </h3>
              <p style={{ color: '#6b7280' }}>
                Submit your first consultation request to get started
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tickets.map(ticket => (
                <div
                  key={ticket._id}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '20px',
                    background: '#fafafa'
                  }}
                >
                  {/* Ticket Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: '600'
                      }}>
                        #{ticket._id?.slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        background: getStatusColor(ticket.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {ticket.status || 'Pending'}
                      </span>
                      {ticket.urgency && (
                        <span style={{
                          background: `${getUrgencyColor(ticket.urgency)}20`,
                          color: getUrgencyColor(ticket.urgency),
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {ticket.urgency} priority
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {new Date(ticket.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Skin Type */}
                  {ticket.skinType && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{
                        background: '#f0f9ff',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {ticket.skinType} Skin
                      </span>
                    </div>
                  )}

                  {/* Photos */}
                  {ticket.photos && ticket.photos.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        📸 {ticket.photos.length} photo(s) uploaded
                      </div>
                    </div>
                  )}

                  {/* Concern */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Your Concern:
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      background: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #f3f4f6'
                    }}>
                      {ticket.concern}
                    </p>
                  </div>

                  {/* Symptoms */}
                  {ticket.symptoms && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        Symptoms:
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6'
                      }}>
                        {ticket.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Consultation Response */}
                  {ticket.consultation && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #d1fae5',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#166534',
                        marginBottom: '8px'
                      }}>
                        👨‍⚕️ Professional Consultation:
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#166534',
                        lineHeight: '1.5',
                        marginBottom: '12px'
                      }}>
                        {ticket.consultation.diagnosis}
                      </p>
                      
                      {ticket.consultation.treatmentPlan && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#166534' }}>Treatment Plan:</strong>
                          <p style={{ fontSize: '14px', color: '#166534', margin: '4px 0' }}>
                            {ticket.consultation.treatmentPlan}
                          </p>
                        </div>
                      )}

                      {ticket.consultation.recommendedProducts && ticket.consultation.recommendedProducts.length > 0 && (
                        <div>
                          <strong style={{ color: '#166534' }}>Recommended Products:</strong>
                          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                            {ticket.consultation.recommendedProducts.map((product, index) => (
                              <li key={index} style={{ fontSize: '14px', color: '#166534' }}>
                                {product.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ticket.status === 'consultation-provided' && !ticket.paymentStatus && (
                      <button
                        onClick={() => processPayment(ticket._id)}
                        disabled={processingPayment === ticket._id}
                        style={{
                          background: '#f97316',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {processingPayment === ticket._id ? 'Processing...' : '💳 Pay for Consultation ($50)'}
                      </button>
                    )}

                    {ticket.consultation && (
                      <button
                        onClick={() => downloadPDF(ticket._id, 'consultation')}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        📄 Download Consultation PDF
                      </button>
                    )}

                    {ticket.paymentStatus === 'completed' && (
                      <button
                        onClick={() => downloadPDF(ticket._id, 'receipt')}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        🧾 Download Payment Receipt
                      </button>
                    )}
                  </div>

                  {/* Legacy answer field for backward compatibility */}
                  {ticket.answer && !ticket.consultation && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #d1fae5',
                      borderRadius: '8px',
                      padding: '16px',
                      marginTop: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#166534',
                        marginBottom: '8px'
                      }}>
                        👨‍⚕️ Professional Response:
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#166534',
                        lineHeight: '1.5'
                      }}>
                        {ticket.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
