import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Ticket from './models/Ticket.js'

dotenv.config()

async function createTestTicket() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    
    // Find user with profile (Tithi Barai)
    const user = await User.findOne({ email: 'tithibarai@gmail.com' })
    if (!user) {
      console.log('User not found')
      process.exit(1)
    }
    
    // Create a test consultation ticket
    const ticket = await Ticket.create({
      user: user._id,
      concern: 'I have been experiencing acne breakouts on my face, especially around my forehead and chin area. The acne seems to be getting worse and I have some dark spots from previous breakouts. I would like professional advice on treatment options.',
      skinType: 'combination',
      symptoms: ['acne', 'dark spots', 'oily T-zone'],
      duration: '3 months',
      previousTreatments: 'Over-the-counter benzoyl peroxide cream',
      allergies: 'None known',
      photos: [
        {
          url: '/uploads/consultation/test-acne-photo.jpg',
          description: 'Current acne condition on face'
        }
      ],
      status: 'submitted',
      priority: 'medium'
    })
    
    console.log('Test ticket created:', ticket._id)
    console.log('For user:', user.name, user.email)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createTestTicket()
