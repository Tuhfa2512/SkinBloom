import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'tasneemtuhfa@gmail.com';
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      
      // List all users
      const allUsers = await User.find({}).select('name email role');
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
      });
      
      return;
    }
    
    console.log('✅ User found:');
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Created: ${user.createdAt}`);
    console.log(`- Last Login: ${user.lastLogin || 'Never'}`);
    
    // Test password
    const testPasswords = ['123456', 'password', 'tasneemtuhfa', '12345678'];
    
    console.log('\n🔐 Testing common passwords...');
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, user.password);
      console.log(`- "${pwd}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
}

testLogin();
