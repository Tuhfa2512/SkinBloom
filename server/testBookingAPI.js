import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function testBookingAPI() {
  try {
    console.log('🧪 Testing Dermatologist Booking API...\n');

    // Step 1: Login as Mehadi
    console.log('1. Logging in as Mehadi...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mehadihasan@gmail.com',
      password: 'mehadi123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.name} (${user.role})`);
    console.log(`📝 Token: ${token.substring(0, 20)}...`);

    // Step 2: Test the bookings endpoint
    console.log('\n2. Fetching bookings...');
    const bookingsResponse = await axios.get(`${API_BASE}/bookings/dermatologist/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Bookings API response received');
    console.log('📊 Response data structure:', typeof bookingsResponse.data);
    console.log('📋 Bookings count:', Array.isArray(bookingsResponse.data) ? bookingsResponse.data.length : 'Not an array');

    if (Array.isArray(bookingsResponse.data)) {
      console.log('\n📅 Bookings found:');
      bookingsResponse.data.forEach((booking, index) => {
        console.log(`${index + 1}. Patient: ${booking.patient?.name || 'Unknown'}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Date: ${new Date(booking.scheduledDateTime).toLocaleString()}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ Response is not an array:', bookingsResponse.data);
    }

  } catch (error) {
    console.error('❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testBookingAPI();
