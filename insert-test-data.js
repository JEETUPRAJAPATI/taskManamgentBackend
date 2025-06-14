import mongoose from 'mongoose';
import './server/models.js';

// Connect and insert test data directly
async function insertTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    // Get Organization schema
    const Organization = mongoose.model('Organization');
    const User = mongoose.model('User');
    
    // Find or create organization
    let org = await Organization.findOne({ name: 'Test Company' });
    if (!org) {
      org = await Organization.create({
        name: 'Test Company',
        slug: 'test-company',
        type: 'company',
        status: 'active'
      });
    }
    
    // Create admin user
    let admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        passwordHash: '$2a$10$example.hash.here',
        role: 'admin',
        organization: org._id,
        status: 'active',
        isActive: true,
        emailVerified: true
      });
    }
    
    // Create invited users
    const invitedUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'member',
        organization: org._id,
        status: 'invited',
        invitedBy: admin._id,
        invitedAt: new Date(),
        isActive: false,
        emailVerified: false,
        passwordHash: 'temp_invite_placeholder'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'employee',
        organization: org._id,
        status: 'invited',
        invitedBy: admin._id,
        invitedAt: new Date(),
        isActive: false,
        emailVerified: false,
        passwordHash: 'temp_invite_placeholder'
      },
      {
        firstName: 'Mike',
        lastName: 'Active',
        email: 'mike@example.com',
        role: 'member',
        organization: org._id,
        status: 'active',
        invitedBy: admin._id,
        invitedAt: new Date(Date.now() - 86400000),
        isActive: true,
        emailVerified: true,
        passwordHash: '$2a$10$example.hash.here'
      }
    ];
    
    for (const userData of invitedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`Created ${userData.status} user: ${userData.email}`);
      }
    }
    
    console.log('Test data created successfully');
    console.log('Admin: admin@test.com');
    console.log('Organization ID:', org._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertTestData();