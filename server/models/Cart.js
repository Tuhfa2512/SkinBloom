import mongoose from 'mongoose'

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    price: { 
      type: Number, 
      required: true 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  totalAmount: { 
    type: Number, 
    default: 0 
  },
  totalItems: { 
    type: Number, 
    default: 0 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0)
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  this.updatedAt = new Date()
  next()
})

// Index for faster queries
cartSchema.index({ userId: 1 })

export default mongoose.model('Cart', cartSchema)
