import mongoose from 'mongoose';
import User from './models/User.js';
import Booking from './models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check dermatologists
    const dermatologists = await User.find({ role: 'dermatologist' }).select('name email role');
    console.log('📋 Dermatologists in database:', dermatologists.length);
    dermatologists.forEach((derm, index) => {
      console.log(`${index + 1}. ${derm.name} (${derm.email}) - Role: ${derm.role}`);
    });
    
    // Check bookings
    const bookings = await Booking.find()
      .populate('patient', 'name email')
      .populate('dermatologist', 'name email')
      .sort({ createdAt: -1 });
    console.log('\n📅 Bookings in database:', bookings.length);
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Patient: ${booking.patient?.name}, Dermatologist: ${booking.dermatologist?.name}, Status: ${booking.status}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkDatabase();
