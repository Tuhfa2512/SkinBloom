import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all bookings
    const bookings = await Booking.find()
      .populate('patient', 'name email')
      .populate('dermatologist', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('📋 Total Bookings:', bookings.length);
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking._id}`);
        console.log(`   Patient: ${booking.patient?.name} (${booking.patient?.email})`);
        console.log(`   Dermatologist: ${booking.dermatologist?.name} (${booking.dermatologist?.email})`);
        console.log(`   Type: ${booking.sessionType}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Date: ${booking.scheduledDateTime}`);
        console.log('---');
      });
    }
    
    // Find Mehadi specifically
    const mehadi = await User.findOne({ name: /mehadi/i });
    if (mehadi) {
      console.log(`\n🔍 Mehadi's ID: ${mehadi._id}`);
      const mehadiBookings = await Booking.find({ dermatologist: mehadi._id })
        .populate('patient', 'name email');
      console.log(`📅 Mehadi's Bookings: ${mehadiBookings.length}`);
      mehadiBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. Patient: ${booking.patient?.name}, Status: ${booking.status}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkBookings();
