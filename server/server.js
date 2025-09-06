
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// routes
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




// env
dotenv.config()
const { PORT = 5000, MONGO_URI, JWT_SECRET, FRONTEND_URL = 'http://localhost:5173' } = process.env

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not set in .env file')
  process.exit(1)
}

const app = express()
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

// static for uploads
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// db
mongoose.connect(MONGO_URI).then(() => {
  console.log('✅ MongoDB connected')
  const port = Number(PORT)
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`)
  })
}).catch(err => {
  console.error('❌ Mongo connection error:', err)
  process.exit(1)
})

// health
app.get('/', (req, res) => res.json({ ok:true, service:'Skinbloom API' }))

// Public routes first
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes) // Public product access

// User protected routes (require authentication)
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
