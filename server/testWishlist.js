import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function testWishlist() {
  try {
    console.log('🧪 Testing Wishlist API...\n');

    // Step 1: Login as test user
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tasneemtuhfa@gmail.com',
      password: '123456'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.name} (${user.role})`);

    // Step 2: Test the wishlist endpoint
    console.log('\n2. Fetching wishlist...');
    const wishlistResponse = await axios.get(`${API_BASE}/wishlist`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Wishlist API response received');
    console.log('📊 Response status:', wishlistResponse.status);
    console.log('📋 Wishlist data:', JSON.stringify(wishlistResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing wishlist API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testWishlist();
