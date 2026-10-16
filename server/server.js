
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import routineRoutes from './routes/routine.js'
import feedbackRoutes from './routes/feedback.js'
import timelineRoutes from './routes/timeline.js'
import ticketRoutes from './routes/ticket.js'
import reminderRoutes from './routes/reminder.js'
import uploadRoutes from './routes/upload.js'
import paymentRoutes from './routes/payments.js'
import productRoutes from './routes/product.js'
import wishlistRoutes from './routes/wishlist.js'
import cartRoutes from './routes/cart.js'
import notificationRoutes from './routes/notification.js'
import bookingRoutes from './routes/booking.js'
import activityRoutes from './routes/activity.js'
import dashboardRoutes from './routes/dashboard.js'

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

const {
  PORT = 5000,
  MONGO_URI,
  JWT_SECRET,
  FRONTEND_URL = 'http://localhost:5173'
} = process.env

// Check required environment variables
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not set in environment variables')
  process.exit(1)
}

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in environment variables')
  process.exit(1)
}

// Initialize Express
const app = express()

// ============================================
// CORS CONFIGURATION
// ============================================

// Allowed frontend URLs
const allowedOrigins = [
  FRONTEND_URL,
  'https://skin-bloom.vercel.app',
  'https://skin-bloom-git-main-tuhfa.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
].map(origin => origin.trim().replace(/\/$/, ''))

// Enable CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}))

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

// Static files for uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
)

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'Skinbloom API'
  })
})

// ============================================
// PUBLIC ROUTES
// ============================================

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

// ============================================
// USER ROUTES
// ============================================

app.use('/api/profile', profileRoutes)
app.use('/api/routine', routineRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/timeline', timelineRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/reminder', reminderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/dashboard', dashboardRoutes)

// ============================================
// MONGODB CONNECTION AND SERVER START
// ============================================

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')

    const port = Number(PORT)

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
    })
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err)
    process.exit(1)
  })
