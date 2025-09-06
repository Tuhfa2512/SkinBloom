import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  type: { 
    type: String, 
    enum: [
      'ticket_submitted',
  'booking_created',
      'ticket_assigned', 
      'consultation_ready',
      'payment_required',
      'payment_received',
      'payment_confirmed',
      'consultation_completed',
      'follow_up_reminder',
      'system_update'
    ], 
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related entities
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
  payment: String, // payment ID
  
  // Status
  read: { type: Boolean, default: false },
  readAt: Date,
  
  // Action required
  actionRequired: { type: Boolean, default: false },
  actionUrl: String,
  actionText: String,
  
  // Priority
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Expiry (for temporary notifications)
  expiresAt: Date
  
}, { timestamps: true })

NotificationSchema.index({ recipient: 1, read: 1 })
NotificationSchema.index({ createdAt: -1 })
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Notification', NotificationSchema)
