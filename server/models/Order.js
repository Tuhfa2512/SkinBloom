import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest checkout
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  
  // Order details
  type: {
    type: String,
    enum: ['consultation', 'product_purchase'],
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    brand: String,
    price: Number,
    quantity: Number,
    subtotal: Number
  }],
  
  // Payment information
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  paymentType: {
    type: String,
    enum: ['full', 'emi', 'cash_discount'],
    default: 'full'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  stripeSessionId: String,
  stripePaymentIntentId: String,
  
  // EMI details (if applicable)
  emiDetails: {
    months: Number,
    monthlyAmount: Number,
    totalAmount: Number,
    interestRate: String,
    remainingPayments: Number
  },
  
  // Shipping information
  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  
  // Order status
  orderStatus: {
    type: String,
    enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  
  // Tracking
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.orderNumber = `SB-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
  }
  this.updatedAt = new Date();
  next();
});

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ sessionId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
