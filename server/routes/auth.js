import { Router } from 'express'
import { register, login, getMe, updateUserRole, getDermatologists } from '../controllers/auth.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const r = Router()

// Public routes
r.post('/register', register)
r.post('/login', login)
r.get('/dermatologists', getDermatologists)

// Protected routes
r.get('/me', authRequired, getMe)

// Admin only routes
r.put('/update-role', authRequired, requireRole('admin'), updateUserRole)

export default r