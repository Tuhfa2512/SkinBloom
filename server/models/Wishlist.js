import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  products: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    },
    priceAlert: {
      enabled: { type: Boolean, default: false },
      targetPrice: { type: Number },
      originalPrice: { type: Number }
    },
    notes: { type: String }, // Personal notes about the product
    priority: { 
      type: String, 
      enum: ['high', 'medium', 'low'], 
      default: 'medium' 
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Compound index for user and product uniqueness
wishlistSchema.index({ userId: 1, 'products.productId': 1 }, { unique: true })

// Update timestamp on save
wishlistSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model('Wishlist', wishlistSchema)
