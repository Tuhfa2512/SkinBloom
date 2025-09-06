import mongoose from 'mongoose'

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['profile_view', 'reply', 'consultation_provided'],
    required: true
  },
  dermatologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // patient user
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  meta: {},
}, { timestamps: true })

ActivitySchema.index({ dermatologist: 1, type: 1, createdAt: -1 })

export default mongoose.model('Activity', ActivitySchema)
