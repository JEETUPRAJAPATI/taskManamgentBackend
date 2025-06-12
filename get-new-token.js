
import mongoose from 'mongoose';
import { storage } from './server/mongodb-storage.js';

async function getNewToken() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    const pendingUsers = await storage.getAllPendingUsers();
    const newUser = pendingUsers.find(u => u.email === 'pg3776725@gmail.com');
    if (newUser) {
      console.log('New token:', newUser.verificationCode);
    } else {
      console.log('No pending user found for pg3776725@gmail.com');
      console.log('All pending users:', pendingUsers.map(u => u.email));
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getNewToken();

