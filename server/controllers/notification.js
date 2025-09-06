import Notification from '../models/Notification.js'

// Get user notifications
export async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    let query = { recipient: req.user.id }
    if (unreadOnly === 'true') {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name role profilePicture')
      .populate('ticket', 'concern status')
      .sort({ createdAt: -1 })
      .limit(limit * page)
      .skip((page - 1) * limit)

    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user.id, 
      read: false 
    })

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error getting notifications:', error)
    res.status(500).json({ error: error.message })
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: error.message })
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    )

    res.json({
      success: true,
      message: 'All notifications marked as read'
    })

  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: error.message })
  }
}

// Delete notification
export async function deleteNotification(req, res) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    })

  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get notification preferences (future feature)
export async function getPreferences(req, res) {
  try {
    // For now, return default preferences
    // This can be expanded to include user-specific notification settings
    res.json({
      emailNotifications: true,
      pushNotifications: true,
      consultationUpdates: true,
      paymentReminders: true,
      followUpReminders: true
    })

  } catch (error) {
    console.error('Error getting notification preferences:', error)
    res.status(500).json({ error: error.message })
  }
}
