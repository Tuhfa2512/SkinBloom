import express from 'express'
import { 
  getDashboardStats, 
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/admin.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Apply authentication to all admin routes
router.use(authRequired)
router.use(requireAdmin)

// Dashboard and statistics
router.get('/dashboard/stats', getDashboardStats)

// User management routes
router.get('/users', getAllUsers)
router.put('/users/role', updateUserRole)
router.delete('/users/:userId', deleteUser)

export default router
