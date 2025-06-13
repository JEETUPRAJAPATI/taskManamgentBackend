import { storage } from './server/mongodb-storage.js';
import mongoose from 'mongoose';

async function regenerateSampleData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    console.log('Regenerating sample data...');
    await storage.initializeSampleData();
    console.log('Sample data regenerated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error regenerating sample data:', error);
    process.exit(1);
  }
}

regenerateSampleData();