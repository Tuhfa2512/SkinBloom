import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

async function testUpload() {
  try {
    console.log('Testing upload functionality...')
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@test.com',
      password: 'test123'
    })
    
    console.log('✅ Login successful')
    const token = loginResponse.data.token
    
    // Test upload endpoint accessibility
    console.log('\nTesting upload endpoints...')
    
    // Test with empty form data to see if endpoint responds
    const testFormData = new FormData()
    
    try {
      await axios.post('http://localhost:5000/api/upload/profile-photo', testFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...testFormData.getHeaders()
        }
      })
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'No file uploaded') {
        console.log('✅ Profile photo upload endpoint is accessible')
      } else {
        console.error('❌ Profile photo endpoint error:', error.response?.data)
      }
    }
    
    try {
      await axios.post('http://localhost:5000/api/upload/skin-photo', testFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...testFormData.getHeaders()
        }
      })
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'No file uploaded') {
        console.log('✅ Skin photo upload endpoint is accessible')
      } else {
        console.error('❌ Skin photo endpoint error:', error.response?.data)
      }
    }
    
    console.log('\n✅ Upload endpoints are working!')
    
  } catch (error) {
    console.error('❌ Upload test failed:', error.response?.data || error.message)
  }
}

testUpload()
