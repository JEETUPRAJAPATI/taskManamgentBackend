import jwt from 'jsonwebtoken';
import { storage } from './server/mongodb-storage.js';

async function generateFreshAuth() {
  try {
    await storage.connectMongoDB();
    
    // Get admin user
    const adminUser = await storage.getUserByEmail('admin@demo.com');
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Found admin user:', {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      organizationId: adminUser.organizationId?.toString()
    });
    
    // Generate fresh token with 24 hour expiry
    const tokenPayload = {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      organizationId: adminUser.organizationId?.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    console.log('Generated fresh token:', token);
    console.log('Token payload:', tokenPayload);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating token:', error);
    process.exit(1);
  }
}

generateFreshAuth();