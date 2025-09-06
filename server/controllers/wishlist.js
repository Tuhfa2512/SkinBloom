import Wishlist from '../models/Wishlist.js'
import Product from '../models/Product.js'

// Get user's wishlist
export async function getWishlist(req, res) {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate('products.productId')
      .lean()
    
    if (!wishlist) {
      return res.json({ products: [] })
    }
    
    res.json(wishlist)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
}

// Add product to wishlist
export async function addToWishlist(req, res) {
  try {
    const { productId, notes, priority = 'medium' } = req.body
    
    // Verify product exists
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id })
    
    if (!wishlist) {
      wishlist = new Wishlist({ 
        userId: req.user.id, 
        products: [] 
      })
    }
    
    // Check if product already in wishlist
    const existingIndex = wishlist.products.findIndex(
      item => item.productId.toString() === productId
    )
    
    if (existingIndex >= 0) {
      return res.status(400).json({ error: 'Product already in wishlist' })
    }
    
    // Add product to wishlist
    wishlist.products.push({
      productId,
      notes,
      priority,
      priceAlert: {
        enabled: false,
        originalPrice: product.price
      }
    })
    
    await wishlist.save()
    
    // Return updated wishlist with populated products
    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('products.productId')
      .lean()
    
    res.json(updatedWishlist)
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    res.status(500).json({ error: 'Failed to add to wishlist' })
  }
}

// Remove product from wishlist
export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params
    
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' })
    }
    
    wishlist.products = wishlist.products.filter(
      item => item.productId.toString() !== productId
    )
    
    await wishlist.save()
    
    // Return updated wishlist with populated products
    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('products.productId')
      .lean()
    
    res.json(updatedWishlist)
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    res.status(500).json({ error: 'Failed to remove from wishlist' })
  }
}

// Update wishlist item (notes, priority, price alerts)
export async function updateWishlistItem(req, res) {
  try {
    const { productId } = req.params
    const { notes, priority, priceAlert } = req.body
    
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' })
    }
    
    const itemIndex = wishlist.products.findIndex(
      item => item.productId.toString() === productId
    )
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Product not in wishlist' })
    }
    
    // Update the item
    const item = wishlist.products[itemIndex]
    if (notes !== undefined) item.notes = notes
    if (priority !== undefined) item.priority = priority
    if (priceAlert !== undefined) {
      item.priceAlert = { ...item.priceAlert, ...priceAlert }
    }
    
    await wishlist.save()
    
    // Return updated wishlist with populated products
    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('products.productId')
      .lean()
    
    res.json(updatedWishlist)
  } catch (error) {
    console.error('Error updating wishlist item:', error)
    res.status(500).json({ error: 'Failed to update wishlist item' })
  }
}

// Clear entire wishlist
export async function clearWishlist(req, res) {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' })
    }
    
    wishlist.products = []
    await wishlist.save()
    
    res.json({ message: 'Wishlist cleared successfully', products: [] })
  } catch (error) {
    console.error('Error clearing wishlist:', error)
    res.status(500).json({ error: 'Failed to clear wishlist' })
  }
}
