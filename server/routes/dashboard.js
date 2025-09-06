import { Router } from 'express'
import { dermatologistRequired } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import Ticket from '../models/Ticket.js'

const r = Router()

r.get('/dermatologist/stats', dermatologistRequired, async (req, res) => {
  try {
    const dermaId = req.user.id
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
    const endOfToday = new Date(); endOfToday.setHours(23,59,59,999)

    const [todayBookings, inProgress, completed] = await Promise.all([
      Booking.countDocuments({ dermatologist: dermaId, scheduledDateTime: { $gte: startOfToday, $lte: endOfToday } }),
      Booking.countDocuments({ dermatologist: dermaId, status: 'in_progress' }),
      Booking.countDocuments({ dermatologist: dermaId, status: 'completed' })
    ])

    const [bookingEarningsAgg, bookingEarningsTodayAgg, ticketEarningsAgg, ticketEarningsTodayAgg] = await Promise.all([
      Booking.aggregate([
        { $match: { dermatologist: req.user._id || dermaId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Booking.aggregate([
        { $match: { dermatologist: req.user._id || dermaId, paymentStatus: 'paid', paymentDate: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Ticket.aggregate([
        { $match: { dermatologist: req.user._id || dermaId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Ticket.aggregate([
        { $match: { dermatologist: req.user._id || dermaId, paymentStatus: 'paid', paymentDate: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ])
    ])

    const bookingsTotal = bookingEarningsAgg[0]?.total || 0
    const bookingsToday = bookingEarningsTodayAgg[0]?.total || 0
    const ticketsTotal = ticketEarningsAgg[0]?.total || 0
    const ticketsToday = ticketEarningsTodayAgg[0]?.total || 0

    const total = bookingsTotal + ticketsTotal
    const today = bookingsToday + ticketsToday

    res.json({
      todayBookings,
      inProgress,
      completed,
      earnings: {
        total,
        today,
        previous: Math.max(total - today, 0),
        breakdown: { bookingsTotal, bookingsToday, ticketsTotal, ticketsToday }
      }
    })
  } catch (error) {
    console.error('Error getting dermatologist stats:', error)
    res.status(500).json({ error: error.message })
  }
})

export default r
