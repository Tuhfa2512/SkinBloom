import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetMehadiPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find Mehadi
    const mehadi = await User.findOne({ email: 'mehadihasan@gmail.com' });
    if (!mehadi) {
      console.log('❌ Mehadi not found');
      process.exit(1);
    }
    
    console.log('✅ Found Mehadi:', mehadi.name);
    
    // Set a simple password
    const newPassword = 'mehadi123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    mehadi.password = hashedPassword;
    await mehadi.save();
    
    console.log('✅ Password updated for Mehadi');
    console.log('📧 Email:', mehadi.email);
    console.log('🔑 New Password:', newPassword);
    console.log('👤 Role:', mehadi.role);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

resetMehadiPassword();
