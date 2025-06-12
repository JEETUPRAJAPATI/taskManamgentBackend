
import mongoose from 'mongoose';
import { storage } from './server/mongodb-storage.js';

async function getLatestToken() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    const pendingUsers = await storage.getAllPendingUsers();
    const freshUser = pendingUsers.find(u => u.email === 'freshfabric70@gmail.com');
    if (freshUser) {
      console.log('Fresh token:', freshUser.verificationCode);
      console.log('Full verification URL: /verify?token=' + freshUser.verificationCode);
    } else {
      console.log('No pending user found for freshfabric70@gmail.com');
      console.log('All pending users:', pendingUsers.map(u => u.email));
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getLatestToken();

