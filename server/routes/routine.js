import { Router } from 'express'
import { authRequired } from '../middleware/auth.js';

import { saveRoutine, getRoutine, logUsage, getLogs } from '../controllers/routine.js'
const r = Router()
r.get('/', authRequired, getRoutine)
r.post('/', authRequired, saveRoutine)
r.post('/log', authRequired, logUsage)
r.get('/log', authRequired, getLogs)
export default r