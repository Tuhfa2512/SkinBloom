import { Router } from 'express'
import { authRequired, dermatologistRequired } from '../middleware/auth.js'
import {
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getDermatologistBookings,
  getBooking,
  updateBookingStatus,
  startConsultation,
  createBookingPayment,
  verifyBookingPayment,
  submitMobileBookingPayment,
  verifyMobileBookingPayment
} from '../controllers/booking.js'

const r = Router()

// Patient routes
r.get('/my-bookings', authRequired, getUserBookings)
r.get('/:id', authRequired, getBooking)
r.post('/', authRequired, createBooking)
r.post('/:id/payment', authRequired, createBookingPayment)
r.post('/:id/verify-payment', authRequired, verifyBookingPayment)
r.post('/:id/mobile-payment', authRequired, submitMobileBookingPayment)
r.post('/:id/mobile-payment/verify', authRequired, verifyMobileBookingPayment)
r.patch('/:id/status', authRequired, updateBookingStatus)

// Dermatologist routes
r.get('/dermatologist/bookings', dermatologistRequired, getDermatologistBookings)
r.get('/dermatologist/:dermatologistId/slots', getAvailableSlots)
r.post('/:id/start', dermatologistRequired, startConsultation)

export default r
