import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skinbloom')
    console.log('✅ Connected to MongoDB')

    // Get the profiles collection
    const db = mongoose.connection.db
    const collection = db.collection('profiles')

    // Drop all existing indexes except _id
    console.log('🔧 Dropping all existing indexes...')
    await collection.dropIndexes()
    console.log('✅ Dropped all indexes')

    // Clear all existing profile documents (since they might have corrupted data)
    console.log('🗑️ Clearing all existing profiles...')
    await collection.deleteMany({})
    console.log('✅ Cleared all profiles')

    // Create the correct index for userId
    console.log('🔧 Creating new userId index...')
    await collection.createIndex({ userId: 1 }, { unique: true })
    console.log('✅ Created userId index')

    console.log('🎉 Database cleanup complete!')
    
  } catch (error) {
    console.error('❌ Error fixing database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

fixDatabase()
