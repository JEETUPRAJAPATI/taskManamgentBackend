
import mongoose from 'mongoose';
import { storage } from './server/mongodb-storage.js';

async function findVerificationToken() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    const pendingUsers = await storage.getAllPendingUsers();
    console.log('Pending users:', pendingUsers.map(u => ({ email: u.email, token: u.verificationCode })));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findVerificationToken();

