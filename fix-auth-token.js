import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function fixAuthToken() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Find a user with admin role
    const user = await mongoose.connection.db.collection('users').findOne({
      email: 'admin@demo.com'
    });

    if (user) {
      console.log('Found admin user:', {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization?.toString()
      });

      const token = jwt.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organization?.toString()
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('\nValid token for API testing:');
      console.log(token);
    } else {
      console.log('No admin user found - creating one...');
      
      // Create a test admin user
      const orgId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      
      await mongoose.connection.db.collection('organizations').insertOne({
        _id: orgId,
        name: 'Demo Organization',
        slug: 'demo-org',
        description: 'Demo organization for testing',
        maxUsers: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await mongoose.connection.db.collection('users').insertOne({
        _id: userId,
        email: 'admin@demo.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        organization: orgId,
        isActive: true,
        status: 'active',
        passwordHash: '$2b$10$dummy.hash.for.testing',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const token = jwt.sign({
        id: userId.toString(),
        email: 'admin@demo.com',
        role: 'admin',
        organizationId: orgId.toString()
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('Created admin user and organization');
      console.log('\nValid token for API testing:');
      console.log(token);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAuthToken();