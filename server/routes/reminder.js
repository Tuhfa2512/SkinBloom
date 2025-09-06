import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { createReminder, listReminders, updateReminder, deleteReminder } from '../controllers/reminders.js'
const r = Router()
r.use(authRequired)
r.get('/', listReminders)
r.post('/', createReminder)
r.put('/:id', updateReminder)
r.delete('/:id', deleteReminder)
export default r
