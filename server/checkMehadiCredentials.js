import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function checkMehadiCredentials() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find Mehadi
    const mehadi = await User.findOne({ email: 'mehadihasan@gmail.com' });
    
    if (!mehadi) {
      console.log('❌ Mehadi not found');
      return;
    }

    console.log('🔍 Mehadi found:');
    console.log('Name:', mehadi.name);
    console.log('Email:', mehadi.email);
    console.log('Role:', mehadi.role);
    console.log('ID:', mehadi._id);
    
    // Test different passwords
    const testPasswords = ['password123', 'dermatologist123', '123456', 'mehadi123'];
    
    console.log('\n🔐 Testing passwords:');
    for (const password of testPasswords) {
      const isMatch = await bcrypt.compare(password, mehadi.password);
      console.log(`${password}: ${isMatch ? '✅ Match' : '❌ No match'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMehadiCredentials();
