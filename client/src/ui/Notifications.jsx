import React, { useState, useEffect } from 'react'
import API from '../auth'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const params = filter === 'unread' ? { unreadOnly: true } : {}
      const { data } = await API.get('/notifications', { params })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`)
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/all/read')
      await loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`)
      await loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ticket_submitted': return '🎫'
      case 'ticket_assigned': return '👨‍⚕️'
      case 'consultation_ready': return '💬'
      case 'consultation_completed': return '🧾'
      case 'payment_required': return '💳'
      case 'payment_received': return '💰'
      case 'payment_confirmed': return '✅'
      case 'follow_up_reminder': return '📅'
      case 'system_update': return '⚙️'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') {
      return '#ef4444'
    }
    
    switch (type) {
      case 'ticket_submitted': return '#3b82f6'
      case 'ticket_assigned': return '#8b5cf6'
      case 'consultation_ready': return '#10b981'
      case 'consultation_completed': return '#0ea5e9'
      case 'payment_required': return '#f59e0b'
      case 'payment_received': return '#06b6d4'
      case 'payment_confirmed': return '#059669'
      case 'follow_up_reminder': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id)
    }
    
    if (notification.actionUrl) {
      // Navigate to the specified URL
      window.location.href = notification.actionUrl
    }
  }

  const formatTimeAgo = (date) => {
    try {
      if (!date) {
        return ''
      }
      const now = new Date()
      const notificationDate = new Date(date)
      if (isNaN(notificationDate.getTime())) {
        return ''
      }
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
      if (diffInMinutes < 1) {
        return 'Just now'
      }
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
      }
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) {
        return `${diffInHours}h ago`
      }
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        return `${diffInDays}d ago`
      }
      return notificationDate.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          Notifications
        </h1>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
            Stay updated with your consultation progress
          </p>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'read', label: 'Read' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '12px 20px',
              background: filter === tab.key ? '#3b82f6' : 'transparent',
              color: filter === tab.key ? 'white' : '#6b7280',
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

      {/* Actions */}
      {unreadCount > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={markAllAsRead}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Mark All as Read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #f3f4f6',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: '#6b7280' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              No notifications
            </h3>
            <p style={{ color: '#6b7280' }}>
              {filter === 'unread' 
                ? 'All caught up! No unread notifications.'
                : 'You don\'t have any notifications yet.'}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '20px',
                  borderBottom: index === notifications.length - 1 ? 'none' : '1px solid #f3f4f6',
                  background: notification.read ? 'white' : '#f8fafc',
                  cursor: notification.actionUrl ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (notification.actionUrl) {
                    e.currentTarget.style.background = '#f1f5f9'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notification.read ? 'white' : '#f8fafc'
                }}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    background: '#3b82f6',
                    borderRadius: '50%'
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  marginLeft: notification.read ? '0' : '16px'
                }}>
                  {/* Icon */}
                  <div style={{
                    fontSize: '24px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${getNotificationColor(notification.type, notification.priority)}20`,
                    borderRadius: '50%',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification._id)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      margin: '0 0 8px 0'
                    }}>
                      {notification.message}
                    </p>

                    {/* Priority indicator */}
                    {notification.priority === 'high' && (
                      <span style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        High Priority
                      </span>
                    )}

                    {/* Action button */}
                    {notification.actionUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{
                          color: getNotificationColor(notification.type, notification.priority),
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          Click to view details →
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mark as read button for unread notifications */}
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(notification._id)
                    }}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '40px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
