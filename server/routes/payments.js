import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { 
    createConsultationCheckout, 
    createProductCheckout,
    verifyPayment,
    getPaymentOptions,
    createBkashPayment,
    executeBkashPayment
} from '../controllers/payments.js'

const r = Router()

// Consultation payment endpoint
r.post('/consultation', createConsultationCheckout)

// Product checkout endpoint
r.post('/checkout', authRequired, createProductCheckout)

// Payment verification endpoint
r.get('/verify/:sessionId', verifyPayment)

// Get payment options (EMI, discounts etc)
r.get('/options', getPaymentOptions)

// bKash sandbox endpoints
r.post('/bkash/create', createBkashPayment)
r.post('/bkash/execute/:paymentID', executeBkashPayment)

// Note: If you want a direct receipt download endpoint later, add it here
// e.g., r.get('/receipt/:sessionId', downloadOrderReceipt)

export default r

