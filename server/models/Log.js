import mongoose from 'mongoose'

const LogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  usedSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  notes: String,
  skinCondition: {
    redness: { type: Number, min:0, max:10, default:0 },
    dryness: { type: Number, min:0, max:10, default:0 },
    acne: { type: Number, min:0, max:10, default:0 }
  }
}, { timestamps: true })

export default mongoose.model('Log', LogSchema)