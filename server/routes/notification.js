import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences
} from '../controllers/notification.js'

const router = express.Router()

// Get user notifications
router.get('/', authenticateToken, getNotifications)

// Mark notification as read
router.patch('/:id/read', authenticateToken, markAsRead)

// Mark all notifications as read
router.patch('/all/read', authenticateToken, markAllAsRead)

// Delete notification
router.delete('/:id', authenticateToken, deleteNotification)

// Get notification preferences
router.get('/preferences', authenticateToken, getPreferences)

export default router
