import mongoose from 'mongoose'

const BookingSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dermatologist: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Booking details
  sessionType: { 
    type: String, 
    enum: ['photo_review', 'video_call', 'follow_up'], 
    required: true 
  },
  scheduledDateTime: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // minutes
  
  // Status tracking
  status: { 
    type: String, 
    enum: [
      'scheduled',
      'confirmed', 
      'in_progress', 
      'completed', 
      'cancelled', 
      'no_show'
    ], 
    default: 'scheduled' 
  },
  
  // Meeting details for video calls
  meetingLink: { type: String },
  meetingId: { type: String },
  
  // Payment information
  consultationFee: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  paymentId: { type: String },
  paymentDate: { type: Date },
  
  // Related documents
  ticket: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket' 
  },
  consultation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consultation' 
  },
  
  // Notes and communication
  patientNotes: { type: String },
  dermatologistNotes: { type: String },
  cancellationReason: { type: String },
  
  // Reminder settings
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  
  // Rating and feedback
  patientRating: { type: Number, min: 1, max: 5 },
  patientFeedback: { type: String },
  dermatologistRating: { type: Number, min: 1, max: 5 },
  dermatologistFeedback: { type: String }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual for booking duration in a readable format
BookingSchema.virtual('durationFormatted').get(function() {
  if (this.duration < 60) {
    return `${this.duration} minutes`
  }
  const hours = Math.floor(this.duration / 60)
  const minutes = this.duration % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
})

// Virtual to check if booking is today
BookingSchema.virtual('isToday').get(function() {
  const today = new Date()
  const bookingDate = new Date(this.scheduledDateTime)
  return today.toDateString() === bookingDate.toDateString()
})

// Virtual to check if booking is upcoming
BookingSchema.virtual('isUpcoming').get(function() {
  return new Date(this.scheduledDateTime) > new Date()
})

// Indexes for efficient queries
BookingSchema.index({ patient: 1, scheduledDateTime: -1 })
BookingSchema.index({ dermatologist: 1, scheduledDateTime: 1 })
BookingSchema.index({ status: 1, scheduledDateTime: 1 })
BookingSchema.index({ scheduledDateTime: 1 })

export default mongoose.model('Booking', BookingSchema)
