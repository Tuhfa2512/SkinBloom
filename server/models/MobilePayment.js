import mongoose from 'mongoose'

const MobilePaymentSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
	amount: { type: Number, required: true },
	provider: { 
		type: String, 
		enum: ['bkash', 'nagad', 'rocket', 'upay', 'other'], 
		required: true 
	},
	phone: { type: String, required: true },
	transactionId: { type: String, required: true },
	status: { type: String, enum: ['submitted', 'verified', 'rejected'], default: 'submitted' },
	notes: { type: String },
}, { timestamps: true })

MobilePaymentSchema.index({ user: 1, booking: 1 })
MobilePaymentSchema.index({ transactionId: 1 }, { unique: true })

export default mongoose.model('MobilePayment', MobilePaymentSchema)

