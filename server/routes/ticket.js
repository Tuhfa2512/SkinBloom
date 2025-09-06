import { Router } from 'express'
import { authRequired, dermatologistRequired } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { 
  createTicket, 
  listTickets, 
  answerTicket,
  getTicket,
  assignTicket,
  provideConsultation,
  markAsSolved,
  createPaymentSession,
  verifyPayment,
  addMessage,
  getUserTickets,
  getTicketById,
  getDermatologistTickets,
  processPayment,
  markAsResolved,
  downloadConsultationPDF,
  downloadPaymentReceiptPDF
} from '../controllers/ticket.js'

const r = Router()

// Dermatologist routes (register specific routes BEFORE generic '/:id' to avoid collisions)
r.get('/dermatologist/tickets', dermatologistRequired, getDermatologistTickets)
r.post('/:id/assign', dermatologistRequired, assignTicket)
r.post('/:id/consultation', dermatologistRequired, provideConsultation)
r.patch('/:id/resolve', dermatologistRequired, markAsResolved)

// User routes
r.get('/my-tickets', authRequired, getUserTickets)
r.get('/:id', authRequired, getTicketById)
r.post('/', authRequired, upload.array('photos', 5), createTicket)
r.post('/:id/payment', authRequired, processPayment)
r.post('/:id/verify-payment', authRequired, verifyPayment)
r.post('/:id/message', authRequired, addMessage)
r.get('/:id/consultation-pdf', authRequired, downloadConsultationPDF)
r.get('/:id/payment-receipt-pdf', authRequired, downloadPaymentReceiptPDF)

// Legacy routes for backward compatibility
r.get('/', authRequired, listTickets)
r.post('/:id/answer', authRequired, answerTicket)

export default r