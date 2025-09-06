import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from './models/Product.js'

dotenv.config()

async function testLocalProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')
    
    const products = await Product.find({}).limit(5)
    console.log('Total products in DB:', await Product.countDocuments())
    console.log('CSV imported products:', await Product.countDocuments({ source: 'csv-import' }))
    
    if (products.length > 0) {
      console.log('First product:', products[0].name)
      console.log('First product category:', products[0].category)
      console.log('First product source:', products[0].source)
    }
    
  } catch (error) {
    console.error('Database error:', error.message)
  } finally {
    await mongoose.connection.close()
  }
}

testLocalProducts()
