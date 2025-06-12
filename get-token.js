
import mongoose from 'mongoose';
import { storage } from './server/mongodb-storage.js';

async function getLatestToken() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    const pendingUsers = await storage.getAllPendingUsers();
    const testUser = pendingUsers.find(u => u.email === 'test-debug@example.com');
    if (testUser) {
      console.log('Token for test-debug@example.com:', testUser.verificationCode);
    } else {
      console.log('No pending user found for test-debug@example.com');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getLatestToken();

