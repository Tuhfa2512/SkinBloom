import axios from 'axios'

async function testAPI() {
  try {
    console.log('Testing API connection...')
    
    // Test server health
    const healthResponse = await axios.get('http://localhost:5000/')
    console.log('✅ Server health check:', healthResponse.data)
    
    // Test login endpoint
    console.log('\nTesting login...')
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@test.com',
      password: 'test123'
    })
    console.log('✅ Login successful:', loginResponse.data)
    
    // Test protected endpoint
    const token = loginResponse.data.token
    console.log('\nTesting protected endpoint...')
    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ Protected endpoint successful:', meResponse.data)
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message)
  }
}

testAPI()
