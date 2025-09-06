import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import 'dotenv/config'

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skinbloom')
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@skinbloom.com',
      password: hashedPassword,
      role: 'admin',
      profileCompleted: true,
      isActive: true
    })

    console.log('Admin user created successfully!')
    console.log('Email: admin@skinbloom.com')
    console.log('Password: admin123')
    console.log('Role: admin')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    mongoose.disconnect()
  }
}

createAdminUser()
