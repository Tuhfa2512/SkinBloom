import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { myTimeline } from '../controllers/timeline.js'
const r = Router()
r.get('/', authRequired, myTimeline)
export default r