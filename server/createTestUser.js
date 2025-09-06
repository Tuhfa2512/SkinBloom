import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@test.com' })
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email)
      process.exit(0)
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10)
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'user'
    })

    console.log('✅ Test user created successfully:', testUser.email)
    
    // Also create an admin user for testing
    const existingAdmin = await User.findOne({ email: 'admin@skinbloom.com' })
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10)
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@skinbloom.com',
        password: adminPassword,
        role: 'admin'
      })
      console.log('✅ Admin user created successfully:', adminUser.email)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating test user:', error)
    process.exit(1)
  }
}

createTestUser()
