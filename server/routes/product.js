import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import { 
  createProduct, 
  getProduct, 
  listProducts, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getPopularProducts
} from '../controllers/product.js'

const r = Router()

// Public endpoints - no auth required
r.get('/', listProducts) // Get all products with filtering
r.get('/featured', getFeaturedProducts) // Get featured products
r.get('/popular', getPopularProducts) // Get popular products
r.get('/search', searchProducts) // Search products
r.get('/category/:category', getProductsByCategory) // Products by category
r.get('/:id', getProduct) // Get single product by ID

// Admin-only endpoints
r.post('/', authRequired, requireRole('admin'), createProduct)
r.put('/:id', authRequired, requireRole('admin'), updateProduct)
r.delete('/:id', authRequired, requireRole('admin'), deleteProduct)

export default r
