import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

// Get user's cart
export async function getCart(req, res) {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId')
      .lean()
    
    if (!cart) {
      return res.json({ items: [], totalAmount: 0, totalItems: 0 })
    }
    
    res.json(cart)
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
}

// Add product to cart
export async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body
    
    // Verify product exists and is in stock
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    if (!product.inStock) {
      return res.status(400).json({ error: 'Product is out of stock' })
    }
    
    if (quantity > product.stockQuantity) {
      return res.status(400).json({ error: 'Not enough stock available' })
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.id })
    
    if (!cart) {
      cart = new Cart({ 
        userId: req.user.id, 
        items: [] 
      })
    }
    
    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    )
    
    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      
      if (newQuantity > product.stockQuantity) {
        return res.status(400).json({ error: 'Cannot add more items - stock limit reached' })
      }
      
      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        quantity,
        price: product.price
      })
    }
    
    await cart.save()
    
    // Return updated cart with populated products
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId')
      .lean()
    
    res.json(updatedCart)
  } catch (error) {
    console.error('Error adding to cart:', error)
    res.status(500).json({ error: 'Failed to add to cart' })
  }
}

// Update cart item quantity
export async function updateCartItem(req, res) {
  try {
    const { productId, quantity } = req.body
    
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' })
    }
    
    // Verify product stock
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    if (quantity > product.stockQuantity) {
      return res.status(400).json({ error: 'Not enough stock available' })
    }
    
    const cart = await Cart.findOne({ userId: req.user.id })
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    )
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Product not in cart' })
    }
    
    cart.items[itemIndex].quantity = quantity
    cart.items[itemIndex].price = product.price // Update price in case it changed
    
    await cart.save()
    
    // Return updated cart with populated products
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId')
      .lean()
    
    res.json(updatedCart)
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Failed to update cart item' })
  }
}

// Remove product from cart
export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params
    
    const cart = await Cart.findOne({ userId: req.user.id })
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }
    
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    )
    
    await cart.save()
    
    // Return updated cart with populated products
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId')
      .lean()
    
    res.json(updatedCart)
  } catch (error) {
    console.error('Error removing from cart:', error)
    res.status(500).json({ error: 'Failed to remove from cart' })
  }
}

// Clear entire cart
export async function clearCart(req, res) {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
    if (!cart) {
      return res.json({ items: [], totalAmount: 0, totalItems: 0 })
    }
    
    cart.items = []
    await cart.save()
    
    res.json({ items: [], totalAmount: 0, totalItems: 0 })
  } catch (error) {
    console.error('Error clearing cart:', error)
    res.status(500).json({ error: 'Failed to clear cart' })
  }
}
