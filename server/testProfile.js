import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Profile from './models/Profile.js'

dotenv.config()

async function testProfileData() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    
    // Find all users
    const users = await User.find().select('name email role')
    console.log('Users found:', users.length)
    
    for (const user of users) {
      console.log(`\nUser: ${user.name} (${user.email}) - Role: ${user.role}`)
      
      // Check if user has a profile
      const profile = await Profile.findOne({ userId: user._id })
      if (profile) {
        console.log(`  Profile exists: Age ${profile.age}, Gender: ${profile.gender}`)
      } else {
        console.log('  No profile found')
      }
    }
    
    // Find dermatologists
    const dermatologists = await User.find({ role: 'dermatologist' })
    console.log(`\nDermatologists found: ${dermatologists.length}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testProfileData()
