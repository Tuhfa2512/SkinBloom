import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

async function createDermatologist() {
  const { MONGO_URI } = process.env
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing in .env')
    process.exit(1)
  }
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB (Atlas)')

    const email = 'dr.sarah@skinbloom.com'
    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.role !== 'dermatologist') {
        existing.role = 'dermatologist'
        await existing.save()
        console.log('🔄 Updated existing user to dermatologist role')
      } else {
        console.log('ℹ️ Dermatologist already exists')
      }
      console.log(`➡️  Login: ${email}`)
      console.log('➡️  Password: test123 (existing password unchanged if already set)')
      await mongoose.disconnect()
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash('test123', 10)
    const dermatologist = await User.create({
      name: 'Dr. Sarah Wilson',
      email,
      password: hashedPassword,
      role: 'dermatologist'
    })

    console.log('✅ Dermatologist created:')
    console.log(`➡️  Login: ${dermatologist.email}`)
    console.log('➡️  Password: test123')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createDermatologist()
