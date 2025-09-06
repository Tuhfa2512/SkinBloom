import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist
} from '../controllers/wishlist.js'

const r = Router()

// All wishlist routes require authentication
r.use(authRequired)

r.get('/', getWishlist)
r.post('/add', addToWishlist)
r.delete('/remove/:productId', removeFromWishlist)
r.put('/update/:productId', updateWishlistItem)
r.delete('/clear', clearWishlist)

export default r
