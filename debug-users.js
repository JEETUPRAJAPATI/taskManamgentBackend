import { storage } from './server/mongodb-storage.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function debugUsers() {
  try {
    console.log('Fetching users...');
    const users = await storage.getUsers();
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization?.toString(),
        isActive: user.isActive
      });
    });

    // Find admin user and create token
    const adminUser = users.find(u => u.email === 'admin@demo.com');
    if (adminUser) {
      console.log('\nFound admin user:', {
        _id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        organization: adminUser.organization?.toString()
      });

      const token = jwt.sign({
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        organizationId: adminUser.organization?.toString()
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('\nGenerated token:', token);
    } else {
      console.log('\nNo admin user found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUsers();