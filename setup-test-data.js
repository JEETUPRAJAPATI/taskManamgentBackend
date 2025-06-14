import { storage } from './server/mongodb-storage.js';
import mongoose from 'mongoose';

async function setupTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    console.log('Connected to MongoDB');

    // Create organization
    const orgData = {
      name: 'TaskSetu Inc',
      slug: 'tasksetu-inc',
      type: 'company',
      status: 'active',
      settings: {
        allowPublicSignup: false,
        requireEmailVerification: true
      }
    };

    let organization;
    try {
      organization = await storage.getOrganizationBySlug('tasksetu-inc');
      if (!organization) {
        organization = await storage.createOrganization(orgData);
        console.log('Created organization:', organization.name);
      } else {
        console.log('Using existing organization:', organization.name);
      }
    } catch (error) {
      console.log('Organization creation error, continuing...');
    }

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tasksetu.com',
      password: 'admin123',
      role: 'admin',
      organization: organization._id,
      status: 'active',
      isActive: true,
      emailVerified: true,
      roles: ['admin']
    };

    let adminUser = await storage.getUserByEmail('admin@tasksetu.com');
    if (!adminUser) {
      adminUser = await storage.createUser(adminData);
      console.log('Created admin user:', adminUser.email);
    } else {
      console.log('Admin user already exists:', adminUser.email);
    }

    // Create some invited users for testing
    const invitedUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        roles: ['member'],
        organization: organization._id,
        status: 'invited',
        invitedBy: adminUser._id,
        invitedAt: new Date(),
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        roles: ['employee'],
        organization: organization._id,
        status: 'invited',
        invitedBy: adminUser._id,
        invitedAt: new Date(),
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        roles: ['member'],
        organization: organization._id,
        status: 'active',
        invitedBy: adminUser._id,
        invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        emailVerified: true,
        isActive: true
      }
    ];

    for (const userData of invitedUsers) {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        await storage.createUser(userData);
        console.log(`Created ${userData.status} user:`, userData.email);
      } else {
        console.log(`User already exists:`, userData.email);
      }
    }

    console.log('Test data setup complete!');
    console.log('Admin credentials: admin@tasksetu.com / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();