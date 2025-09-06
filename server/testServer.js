import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from './models/Product.js'

dotenv.config()

const app = express()

// Simple endpoint that only fetches local products
app.get('/test-products', async (req, res) => {
  try {
    console.log('Fetching local products...')
    const products = await Product.find({}).limit(10)
    console.log('Found', products.length, 'products')
    res.json({
      total: products.length,
      products: products,
      sources: { local: products.length }
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ Test server connected to MongoDB')
  app.listen(5001, () => {
    console.log('🧪 Test server running on http://localhost:5001')
  })
}).catch(err => {
  console.error('❌ Test server DB error:', err)
})
