import mongoose from 'mongoose'

const ReminderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },          // e.g. "AM Cleanser"
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    timeOfDay: { type: String, enum: ['AM','PM','Custom'], default: 'AM' },
    at: { type: String },                              // "08:00"
    days: [{ type: String }],                          // ['Mon','Tue',...]
    enabled: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Reminder', ReminderSchema)
