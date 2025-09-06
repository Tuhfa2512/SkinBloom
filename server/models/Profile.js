import mongoose from 'mongoose'

const ProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  photo: {
    type: String,
    default: null
  },
  // Professional qualification (for dermatologists)
  qualification: {
    type: String,
    maxlength: 150,
    default: ''
  },
  consultationPhotos: [{
    url: String,
    uploadDate: { type: Date, default: Date.now },
    concerns: [String],
    notes: String
  }],
  skinType: {
    type: String,
    enum: ['oily', 'dry', 'combination', 'sensitive', 'normal'],
    default: 'normal'
  },
  age: {
    type: Number,
    required: true,
    min: 13,
    max: 100
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  concerns: [{
    type: String,
    enum: ['acne', 'wrinkles', 'dark-spots', 'dryness', 'oiliness', 'sensitivity', 'large-pores', 'uneven-tone', 'redness', 'blackheads']
  }],
  skinGoals: [{
    type: String,
    enum: ['clear-skin', 'anti-aging', 'hydration', 'brightening', 'oil-control', 'sensitive-care']
  }],
  dermatologistRecommended: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true })

export default mongoose.model('Profile', ProfileSchema)