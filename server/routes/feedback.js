import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { saveFeedback, listMyFeedback } from '../controllers/feedback.js'
const r = Router()
r.get('/', authRequired, listMyFeedback)
r.post('/', authRequired, saveFeedback)
export default r