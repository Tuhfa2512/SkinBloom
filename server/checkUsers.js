import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

async function checkUsers() {
  const { MONGO_URI } = process.env
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing in .env')
    process.exit(1)
  }
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB (Atlas)')

    const users = await User.find({}).lean()
    if (!users.length) {
      console.log('\n(No users found)')
    } else {
      console.log('\n📋 All Users:')
      users.forEach(u => console.log(`- ${u.email} (${u.role}) - ${u.name}`))
    }

    const dermatologists = users.filter(u => u.role === 'dermatologist')
    console.log('\n👨‍⚕️ Dermatologists:')
    if (!dermatologists.length) {
      console.log('  (none)')
    }
    dermatologists.forEach(d => console.log(`- ${d.email} - ${d.name}`))

    await mongoose.disconnect()
    console.log('\n✅ Done')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUsers()
