import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  skinType: [{ type: String, enum: ['All', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'] }],
  description: { type: String, required: true },
  step: { type: Number, required: true, min: 1, max: 10 },
  popular: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 }, // For showing discounts
  discount: { type: Number, default: 0, min: 0, max: 100 }, // Percentage discount
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  ingredients: [{ type: String }],
  benefits: [{ type: String }],
  howToUse: { type: String },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 100 },
  source: { type: String, default: 'local', enum: ['local', 'makeup-api', 'sephora', 'ulta'] },
  tags: [{ type: String }],
  ageRange: { type: String, default: 'All ages' },
  concerns: [{ type: String }], // acne, aging, dark spots, etc.
  texture: { type: String }, // cream, gel, foam, etc.
  size: { type: String }, // volume/weight
  applicationTime: [{ type: String, enum: ['AM', 'PM', 'Both'] }],
  spf: { type: Number, min: 0 }, // for sunscreen products
  crueltyFree: { type: Boolean, default: false },
  vegan: { type: Boolean, default: false },
  fragrance: { type: String, enum: ['Fragrance-free', 'Light fragrance', 'Strong fragrance'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Index for search performance
productSchema.index({ name: 'text', brand: 'text', description: 'text' })
productSchema.index({ category: 1, skinType: 1 })
productSchema.index({ popular: -1, rating: -1 })
productSchema.index({ price: 1 })

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model('Product', productSchema)
