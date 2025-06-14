import mongoose from 'mongoose';
import { User } from './server/models.js';

async function checkRohitUser() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/tasksetu');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'rohit@gmail.com' });
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('First Name:', user.firstName);
      console.log('Last Name:', user.lastName);
      console.log('Account Type:', user.accountType);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkRohitUser();