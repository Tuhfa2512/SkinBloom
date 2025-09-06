import mongoose from 'mongoose'

const ConsultationSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dermatologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Consultation details
  sessionType: { type: String, enum: ['photo_review', 'video_call', 'follow_up'], default: 'photo_review' },
  duration: Number, // in minutes
  
  // Medical assessment
  diagnosis: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
  recommendations: { type: String, required: true },
  
  // Treatment plan
  treatmentPlan: [{
    step: Number,
    instruction: String,
    duration: String, // e.g., "2 weeks", "daily"
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  }],
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  followUpInstructions: String,
  
  // Files and documentation
  consultationNotes: String,
  pdfUrl: String,
  
  // Status tracking
  status: { type: String, enum: ['draft', 'completed', 'sent_to_patient'], default: 'draft' },
  completedAt: Date,
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

ConsultationSchema.index({ ticket: 1 })
ConsultationSchema.index({ user: 1, dermatologist: 1 })
ConsultationSchema.index({ createdAt: -1 })

export default mongoose.model('Consultation', ConsultationSchema)
