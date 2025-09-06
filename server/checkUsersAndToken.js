import mongoose from 'mongoose';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/skinbloom', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function checkUsersAndCreateToken() {
  await connectDB();
  
  try {
    // Check existing users
    const users = await User.find({}).select('-password');
    console.log('Found users:', users.length);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('First user:', { id: user._id, email: user.email, role: user.role });
      
      // Create a token for this user
      const token = jwt.sign(
        { userId: user._id },
        'your-secret-key', // This should match your JWT secret
        { expiresIn: '24h' }
      );
      
      console.log('Generated token:', token);
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
      
      // Test the token
      try {
        const decoded = jwt.verify(token, 'your-secret-key');
        console.log('Token verified successfully:', decoded);
      } catch (err) {
        console.log('Token verification failed:', err.message);
      }
    } else {
      console.log('No users found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsersAndCreateToken();
