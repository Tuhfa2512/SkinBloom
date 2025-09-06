import axios from 'axios'

async function testApi() {
  try {
    console.log('Testing API endpoint...')
    
    const response = await axios.get('http://localhost:5000/api/products?source=local')
    console.log('✅ API Response received')
    console.log('Total products:', response.data.total)
    console.log('Products array length:', response.data.products?.length || 0)
    console.log('Sources:', response.data.sources)
    
    if (response.data.products?.length > 0) {
      console.log('First product:', response.data.products[0].name)
      console.log('First product category:', response.data.products[0].category)
      console.log('First product source:', response.data.products[0].source)
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message)
    console.error('Full error:', error)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    } else if (error.code) {
      console.error('Error Code:', error.code)
    }
  }
}

testApi()
