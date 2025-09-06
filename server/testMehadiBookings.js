import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Booking from './models/Booking.js';

dotenv.config();

async function testMehadiBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find Mehadi
    const mehadi = await User.findOne({ email: 'mehadihasan@gmail.com' });
    console.log('🔍 Mehadi found:', mehadi ? `${mehadi.name} (${mehadi._id})` : 'Not found');

    if (!mehadi) {
      console.log('❌ Mehadi not found');
      return;
    }

    // Get Mehadi's bookings using the same logic as the API
    const bookings = await Booking.find({ dermatologist: mehadi._id })
      .populate('patient', 'name email')
      .populate('dermatologist', 'name email')
      .sort({ scheduledDateTime: -1 });

    console.log(`\n📅 Mehadi's Bookings (${bookings.length}):`);
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Patient: ${booking.patient?.name || 'Unknown'}`);
      console.log(`   Email: ${booking.patient?.email || 'N/A'}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.scheduledDateTime}`);
      console.log(`   Type: ${booking.sessionType}`);
      console.log(`   Fee: $${booking.consultationFee}`);
      console.log('---');
    });

    // Test the exact API endpoint logic
    console.log('\n🧪 Testing API endpoint logic...');
    const apiResult = await Booking.find({ dermatologist: mehadi._id })
      .populate('patient', 'name email')
      .populate('dermatologist', 'name email')
      .sort({ scheduledDateTime: -1 });

    console.log(`API would return ${apiResult.length} bookings`);
    
    if (apiResult.length > 0) {
      console.log('✅ API endpoint should work correctly');
    } else {
      console.log('❌ API endpoint would return no bookings');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMehadiBookings();
