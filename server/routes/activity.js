import { Router } from 'express'
import { dermatologistRequired } from '../middleware/auth.js'
import Activity from '../models/Activity.js'

const r = Router()

// GET /api/activity/stats - dermatologist stats (profile views, replies, consultations)
r.get('/stats', dermatologistRequired, async (req, res) => {
  try {
    const dermatologist = req.user.id

    const [views, replies, consultations] = await Promise.all([
      Activity.countDocuments({ dermatologist, type: 'profile_view' }),
      Activity.countDocuments({ dermatologist, type: 'reply' }),
      Activity.countDocuments({ dermatologist, type: 'consultation_provided' })
    ])

    res.json({
      views,
      replies,
      consultations
    })
  } catch (error) {
    console.error('Error fetching activity stats:', error)
    res.status(500).json({ error: error.message })
  }
})

export default r
