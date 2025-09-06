import mongoose from 'mongoose'

const StepSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  note: String,
  timeOfDay: { type: String, enum:['AM','PM'] }
}, { _id:false })

const RoutineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  steps: [StepSchema],
  remindersEnabled: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Routine', RoutineSchema)