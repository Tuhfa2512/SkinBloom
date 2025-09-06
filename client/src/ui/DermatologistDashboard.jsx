import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../auth';

export default function DermatologistDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [consultation, setConsultation] = useState({
    diagnosis: '',
    treatmentPlan: '',
    recommendedProducts: []
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tickets, bookings
  const [activeSubTab, setActiveSubTab] = useState('pending'); // for tickets: pending, assigned, completed
  const [activity, setActivity] = useState({ views: 0, replies: 0, consultations: 0 });
  const [kpis, setKpis] = useState({ todayBookings: 0, inProgress: 0, completed: 0, earnings: { total: 0, today: 0, previous: 0 } });

  useEffect(() => {
    loadTickets();
    loadBookings();
    loadProducts();
  loadActivityStats();
  loadDashboardStats();
  }, []);

  const loadTickets = async () => {
    try {
      const { data } = await API.get('/tickets/dermatologist/tickets');
      const list = Array.isArray(data) ? data : (data.tickets || []);
      setTickets(list);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data } = await API.get('/bookings/dermatologist/bookings');
      const list = Array.isArray(data) ? data : (data.bookings || []);
      setBookings(list);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await API.get('/products');
      setAvailableProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadActivityStats = async () => {
    try {
      const { data } = await API.get('/activity/stats');
      setActivity({
        views: data.views || 0,
        replies: data.replies || 0,
        consultations: data.consultations || 0,
      });
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const { data } = await API.get('/dashboard/dermatologist/stats');
      setKpis({
        todayBookings: data.todayBookings || 0,
        inProgress: data.inProgress || 0,
        completed: data.completed || 0,
        earnings: data.earnings || { total: 0, today: 0, previous: 0 },
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const assignTicket = async (ticketId) => {
    try {
      await API.post(`/tickets/${ticketId}/assign`);
      await loadTickets();
      alert('Ticket assigned successfully!');
    } catch (error) {
      alert('Failed to assign ticket');
    }
  };

  const submitConsultation = async () => {
    if (!selectedTicket || !consultation.diagnosis.trim()) {
      alert('Please provide a diagnosis');
      return;
    }

    try {
      setSubmitting(true);
      await API.post(`/tickets/${selectedTicket._id}/consultation`, {
        diagnosis: consultation.diagnosis,
        treatmentPlan: consultation.treatmentPlan,
        recommendedProducts: (consultation.recommendedProducts || []).map(p => p._id),
      });
      setSelectedTicket(null);
      setConsultation({
        diagnosis: '',
        treatmentPlan: '',
        recommendedProducts: []
      });
      await loadTickets();
      alert('Consultation provided successfully!');
    } catch (error) {
      console.error('Failed to submit consultation:', error);
      alert('Failed to submit consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const markAsResolved = async (ticketId) => {
    try {
      await API.patch(`/tickets/${ticketId}/resolve`);
      await loadTickets();
      alert('Ticket marked as resolved!');
    } catch (error) {
      console.error('Failed to mark as resolved:', error);
      alert('Failed to mark as resolved');
    }
  };

  const addRecommendedProduct = (product) => {
    if (!consultation.recommendedProducts.find(p => p._id === product._id)) {
      setConsultation(prev => ({
        ...prev,
        recommendedProducts: [...prev.recommendedProducts, product]
      }));
    }
  };

  const removeRecommendedProduct = (productId) => {
    setConsultation(prev => ({
      ...prev,
      recommendedProducts: prev.recommendedProducts.filter(p => p._id !== productId)
    }));
  };

  const loadUserProfile = async (userId) => {
    console.log('Loading user profile for userId:', userId);
    setLoadingProfile(true);
    try {
      const response = await API.get(`/profile/user/${userId}`);
      console.log('Profile response:', response);
      setSelectedUserProfile(response.data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      console.error('Error response:', error.response);
      alert(`Failed to load user profile: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getFilteredTickets = () => {
    // For now, show all tickets. If needed, wire activeSubTab to filter by status.
    return tickets;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'in-consultation': return '#8b5cf6';
      case 'consultation-provided': return '#10b981';
  case 'resolved': return '#059669';
  case 'paid': return '#064e3b';
      default: return '#6b7280';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p>Loading dermatologist dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          Dermatologist Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Welcome back, Dr. {user?.name}! Manage your patient consultations.
        </p>
      </div>

      {/* Stats Overview (Bookings + Earnings) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
          <h3 style={{ color: '#3b82f6', fontSize: '28px', margin: 0 }}>{kpis.todayBookings}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Today's Bookings</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧭</div>
          <h3 style={{ color: '#8b5cf6', fontSize: '28px', margin: 0 }}>{kpis.inProgress}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>In Progress</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
          <h3 style={{ color: '#f59e0b', fontSize: '28px', margin: 0 }}>${kpis.earnings.today}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Today's Earnings</p>
          <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '12px' }}>Previous: ${kpis.earnings.previous} • Total: ${kpis.earnings.total}</p>
        </div>
      </div>

      {/* Activity Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👁️</div>
          <h3 style={{ color: '#3b82f6', fontSize: '28px', margin: 0 }}>{activity.views}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Profile Views</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✉️</div>
          <h3 style={{ color: '#8b5cf6', fontSize: '28px', margin: 0 }}>{activity.replies}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Replies</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <h3 style={{ color: '#10b981', fontSize: '28px', margin: 0 }}>{activity.consultations}</h3>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Consultations Provided</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'bookings', label: `Bookings (${bookings.length})` },
          { key: 'tickets', label: `Tickets (${tickets.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.key ? '#3b82f6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Tickets List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #f3f4f6'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#1f2937'
          }}>
            Tickets
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {getFilteredTickets().map(ticket => (
              <div
                key={ticket._id}
                style={{
                  border: '1px solid #f3f4f6',
                  borderRadius: '8px',
                  padding: '16px',
                  background: selectedTicket?._id === ticket._id ? '#f0f9ff' : '#fafafa'
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      #{ticket._id?.slice(-6).toUpperCase()}
                    </span>
                    <span style={{
                      background: getStatusColor(ticket.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {ticket.status}
                    </span>
                    <span style={{
                      background: `${getUrgencyColor(ticket.priority || 'medium')}20`,
                      color: getUrgencyColor(ticket.priority || 'medium'),
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {ticket.priority || 'medium'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Patient Info */}
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '4px'
                  }}>
                    Patient: {ticket.user?.name || 'Anonymous'}
                  </h4>
                  {ticket.user?.profile?.age && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      Age: {ticket.user.profile.age}
                    </span>
                  )}
                  {ticket.user?.profile?.gender && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginLeft: '6px'
                    }}>
                      {ticket.user.profile.gender}
                    </span>
                  )}
                </div>

                {/* Concern Preview */}
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.4',
                  marginBottom: '12px'
                }}>
                  {ticket.concern?.substring(0, 120)}...
                </p>

                {/* Photos indicator */}
                {ticket.photos && ticket.photos.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      📸 {ticket.photos.length} photo(s)
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ticket.status === 'pending' && (
                    <button
                      onClick={() => assignTicket(ticket._id)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Take Case
                    </button>
                  )}
                  
                  {['assigned', 'in-consultation'].includes(ticket.status) && (
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Provide Consultation
                    </button>
                  )}

                  {ticket.status === 'consultation-provided' && ticket.paymentStatus === 'paid' && (
                    <button
                      onClick={() => markAsResolved(ticket._id)}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                  
                  {ticket.user?._id && (
                    <button
                      onClick={() => loadUserProfile(ticket.user._id)}
                      style={{
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '4px'
                      }}
                    >
                      View Profile
                    </button>
                  )}
                </div>
              </div>
            ))}

            {getFilteredTickets().length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <p>No cases in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Consultation Panel */}
        {selectedTicket && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #f3f4f6',
            height: 'fit-content'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Case Details
              </h2>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Patient Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                Patient Information
              </h3>
              <div style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #f3f4f6'
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>Name:</strong> {selectedTicket.user?.name || 'Anonymous'}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>Age:</strong> {selectedTicket.user?.profile?.age || 'N/A'}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>Gender:</strong> {selectedTicket.user?.profile?.gender || 'N/A'}
                </p>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  <strong>Payment:</strong> {selectedTicket.paymentStatus}
                </p>
              </div>
            </div>

            {/* Concern Details */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                Skin Concern
              </h3>
              <div style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #f3f4f6',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {selectedTicket.concern}
              </div>
            </div>

            {/* Symptoms */}
            {selectedTicket.symptoms && selectedTicket.symptoms.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  Symptoms
                </h3>
                <div style={{
                  background: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #f3f4f6',
                  fontSize: '14px'
                }}>
                  {Array.isArray(selectedTicket.symptoms) ? selectedTicket.symptoms.join(', ') : selectedTicket.symptoms}
                </div>
              </div>
            )}

            {/* Patient Profile Concerns */}
            {selectedTicket.user?.profile?.concerns && selectedTicket.user.profile.concerns.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  Patient Reported Concerns
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  {selectedTicket.user.profile.concerns.map((c, i) => (
                    <span key={i} style={{
                      background: '#eef2ff',
                      color: '#4338ca',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {c.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {selectedTicket.photos && selectedTicket.photos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  Patient Photos
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '8px'
                }}>
                  {selectedTicket.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`http://localhost:5000${photo}`}
                      alt={`Patient photo ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Form */}
            {['assigned', 'in-consultation'].includes(selectedTicket.status) && (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '16px'
                }}>
                  Provide Consultation
                </h3>

                {/* Diagnosis */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Diagnosis *
                  </label>
                  <textarea
                    value={consultation.diagnosis}
                    onChange={(e) => setConsultation(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Provide your professional diagnosis..."
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

                {/* Treatment Plan */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Treatment Plan
                  </label>
                  <textarea
                    value={consultation.treatmentPlan}
                    onChange={(e) => setConsultation(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                    placeholder="Recommended treatment steps..."
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

                {/* Product Recommendations */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Recommended Products
                  </label>
                  
                  <select
                    onChange={(e) => {
                      const product = availableProducts.find(p => p._id === e.target.value);
                      if (product) {
                        addRecommendedProduct(product);
                      }
                      e.target.value = '';
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}
                  >
                    <option value="">Select a product to recommend</option>
                    {availableProducts.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>

                  {consultation.recommendedProducts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {consultation.recommendedProducts.map(product => (
                        <div
                          key={product._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f0f9ff',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                        >
                          <span>{product.name}</span>
                          <button
                            onClick={() => removeRecommendedProduct(product._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={submitConsultation}
                  disabled={submitting || !consultation.diagnosis.trim()}
                  style={{
                    width: '100%',
                    background: submitting || !consultation.diagnosis.trim() ? '#d1d5db' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting || !consultation.diagnosis.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Consultation'}
                </button>
              </div>
            )}

            {/* Existing Consultation Display */}
            {selectedTicket.consultation && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#166534',
                  marginBottom: '12px'
                }}>
                  Previous Consultation
                </h3>
                <div style={{ fontSize: '14px', color: '#166534', lineHeight: '1.5' }}>
                  <p><strong>Diagnosis:</strong> {selectedTicket.consultation.diagnosis}</p>
                  {selectedTicket.consultation.treatmentPlan && (
                    <p><strong>Treatment:</strong> {selectedTicket.consultation.treatmentPlan}</p>
                  )}
                  {selectedTicket.consultation.recommendedProducts?.length > 0 && (
                    <div>
                      <strong>Recommended Products:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {selectedTicket.consultation.recommendedProducts.map((product, index) => (
                          <li key={index}>{product.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Patient Profile
              </h2>
              <button
                onClick={() => setSelectedUserProfile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {loadingProfile ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading profile...</p>
              </div>
            ) : (
              <>
                {/* User Basic Info */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Basic Information
                  </h3>
                  <div style={{
                    background: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6'
                  }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Name:</strong> {selectedUserProfile.user?.name}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Email:</strong> {selectedUserProfile.user?.email}
                    </p>
                    <p style={{ margin: '0' }}>
                      <strong>Member Since:</strong> {new Date(selectedUserProfile.user?.memberSince).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Profile Picture */}
                {selectedUserProfile.profile?.photo && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Profile Picture
                    </h3>
                    <img
                      src={`http://localhost:5000${selectedUserProfile.profile.photo}`}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '3px solid #f3f4f6'
                      }}
                    />
                  </div>
                )}

                {/* Health Profile */}
                {selectedUserProfile.profile && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Health Profile
                    </h3>
                    <div style={{
                      background: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Age:</strong> {selectedUserProfile.profile.age || 'Not specified'}
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Gender:</strong> {selectedUserProfile.profile.gender || 'Not specified'}
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <strong>Skin Type:</strong> {selectedUserProfile.profile.skinType || 'Not specified'}
                      </p>
                      {selectedUserProfile.profile.concerns?.length > 0 && (
                        <p style={{ margin: '0 0 8px 0' }}>
                          <strong>Concerns:</strong> {selectedUserProfile.profile.concerns.join(', ')}
                        </p>
                      )}
                      {selectedUserProfile.profile.allergies?.length > 0 && (
                        <p style={{ margin: '0 0 8px 0' }}>
                          <strong>Allergies:</strong> {selectedUserProfile.profile.allergies.join(', ')}
                        </p>
                      )}
                      {selectedUserProfile.profile.notes && (
                        <p style={{ margin: '0' }}>
                          <strong>Notes:</strong> {selectedUserProfile.profile.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Consultation Photos */}
                {selectedUserProfile.profile?.consultationPhotos?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Previous Consultation Photos
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '12px'
                    }}>
                      {selectedUserProfile.profile.consultationPhotos.map((photo, index) => (
                        <div key={index} style={{
                          border: '1px solid #f3f4f6',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={`http://localhost:5000${photo.url}`}
                            alt={`Consultation ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '120px',
                              objectFit: 'cover'
                            }}
                          />
                          {photo.concerns && (
                            <div style={{ padding: '8px', fontSize: '11px', color: '#6b7280' }}>
                              {photo.concerns.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
