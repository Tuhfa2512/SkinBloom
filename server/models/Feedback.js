import mongoose from 'mongoose'

const FeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: { type: Number, min:1, max:5, required: true },
  reaction: { type: String, enum:['irritation','improvement','neutral'], default: 'neutral' },
  note: String
}, { timestamps: true })

FeedbackSchema.index({ user:1, product:1 }, { unique: true })

export default mongoose.model('Feedback', FeedbackSchema)