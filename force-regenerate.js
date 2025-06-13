import { MongoStorage } from './server/mongodb-storage.js';
import mongoose from 'mongoose';

const storage = new MongoStorage();

async function forceRegenerate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/tasksetu');
    console.log('Connected successfully');

    console.log('Clearing existing data...');
    await mongoose.connection.db.dropDatabase();
    
    console.log('Regenerating enhanced sample data...');
    await storage.initializeSampleData();
    
    console.log('Sample data regenerated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

forceRegenerate();