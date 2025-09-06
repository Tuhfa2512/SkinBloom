import Product from '../models/Product.js'

// Get all products with filtering and pagination
export async function listProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      skinType,
      priceMin,
      priceMax,
      sortBy = 'popular',
      search,
      featured,
      inStock
    } = req.query

    // Build filter object
    const filter = {}
    
    if (category) filter.category = new RegExp(category, 'i')
    if (skinType) filter.skinType = { $in: [skinType] }
    if (priceMin || priceMax) {
      filter.price = {}
      if (priceMin) filter.price.$gte = Number(priceMin)
      if (priceMax) filter.price.$lte = Number(priceMax)
    }
    if (featured === 'true') filter.featured = true
    if (inStock === 'true') filter.inStock = true
    
    // Search in name, brand, and description
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Build sort object
    let sort = {}
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 }
        break
      case 'price-high':
        sort = { price: -1 }
        break
      case 'rating':
        sort = { rating: -1 }
        break
      case 'name':
        sort = { name: 1 }
        break
      case 'newest':
        sort = { createdAt: -1 }
        break
      default: // 'popular'
        sort = { popular: -1, rating: -1 }
    }

    const skip = (Number(page) - 1) * Number(limit)
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter)
    ])

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// Get single product by ID
export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
}

// Create new product (admin only)
export async function createProduct(req, res) {
  try {
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
}

// Update product (admin only)
export async function updateProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

// Delete product (admin only)
export async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

// Get products by category
export async function getProductsByCategory(req, res) {
  try {
    const { category } = req.params
    const { limit = 10 } = req.query
    
    const products = await Product.find({ 
      category: new RegExp(category, 'i') 
    })
    .sort({ popular: -1, rating: -1 })
    .limit(Number(limit))
    .lean()
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// Search products
export async function searchProducts(req, res) {
  try {
    const { q, limit = 10 } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }
    
    const products = await Product.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
    .sort({ popular: -1, rating: -1 })
    .limit(Number(limit))
    .lean()
    
    res.json(products)
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({ error: 'Failed to search products' })
  }
}

// Get featured products
export async function getFeaturedProducts(req, res) {
  try {
    const { limit = 8 } = req.query
    
    const products = await Product.find({ featured: true })
      .sort({ rating: -1 })
      .limit(Number(limit))
      .lean()
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    res.status(500).json({ error: 'Failed to fetch featured products' })
  }
}

// Get popular products
export async function getPopularProducts(req, res) {
  try {
    const { limit = 8 } = req.query
    
    const products = await Product.find({ popular: true })
      .sort({ rating: -1 })
      .limit(Number(limit))
      .lean()
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching popular products:', error)
    res.status(500).json({ error: 'Failed to fetch popular products' })
  }
}
