import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.js'

const r = Router()

// All cart routes require authentication
r.use(authRequired)

r.get('/', getCart)
r.post('/add', addToCart)
r.put('/update', updateCartItem)
r.delete('/remove/:productId', removeFromCart)
r.delete('/clear', clearCart)

export default r
