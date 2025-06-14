import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import './server/models.js';

const { User, Organization } = mongoose.models;

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    // Find existing organization
    const org = await Organization.findOne({});
    if (!org) {
      console.error('No organization found');
      process.exit(1);
    }

    // Create test admin user
    const passwordHash = await bcryptjs.hash('admin123', 10);
    
    let testAdmin = await User.findOne({ email: 'testadmin@demo.com' });
    if (!testAdmin) {
      testAdmin = await User.create({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'testadmin@demo.com',
        passwordHash,
        role: 'admin',
        organization: org._id,
        status: 'active',
        isActive: true,
        emailVerified: true,
        roles: ['admin']
      });
      console.log('Created test admin:', testAdmin.email);
    }

    // Create sample invited and active users
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        passwordHash: 'temp_invite_placeholder',
        role: 'member',
        roles: ['member'],
        organization: org._id,
        status: 'invited',
        invitedBy: testAdmin._id,
        invitedAt: new Date(),
        isActive: false,
        emailVerified: false,
        inviteToken: 'invite_token_' + Date.now(),
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        passwordHash: 'temp_invite_placeholder',
        role: 'employee',
        roles: ['employee'],
        organization: org._id,
        status: 'invited',
        invitedBy: testAdmin._id,
        invitedAt: new Date(),
        isActive: false,
        emailVerified: false,
        inviteToken: 'invite_token_' + (Date.now() + 1),
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        passwordHash: await bcryptjs.hash('user123', 10),
        role: 'member',
        roles: ['member'],
        organization: org._id,
        status: 'active',
        invitedBy: testAdmin._id,
        invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isActive: true,
        emailVerified: true
      }
    ];

    for (const userData of sampleUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`Created ${userData.status} user:`, userData.email);
      }
    }

    // Generate test token
    const token = jwt.sign(
      { 
        id: testAdmin._id, 
        email: testAdmin.email, 
        role: testAdmin.role,
        organizationId: org._id,
        organizationName: org.name,
        firstName: testAdmin.firstName,
        lastName: testAdmin.lastName
      }, 
      'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('\n=== Test Setup Complete ===');
    console.log('Login: testadmin@demo.com / admin123');
    console.log('Test Token:', token);
    console.log('Organization:', org.name);
    console.log('Organization ID:', org._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();