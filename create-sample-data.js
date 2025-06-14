import { storage } from './server/mongodb-storage.js';
import mongoose from 'mongoose';

async function createSampleData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    console.log('Connected to MongoDB');

    // Create organization first
    let organization;
    try {
      organization = await storage.getOrganizationBySlug('tasksetu-demo');
      if (!organization) {
        const orgData = {
          name: 'TaskSetu Demo Company',
          slug: 'tasksetu-demo',
          type: 'company',
          status: 'active',
          settings: {
            allowPublicSignup: false,
            requireEmailVerification: true
          }
        };
        organization = await storage.createOrganization(orgData);
        console.log('Created organization:', organization.name);
      }
    } catch (orgError) {
      console.log('Using existing organization setup');
      const orgs = await mongoose.model('Organization').find({}).limit(1);
      organization = orgs[0];
    }

    if (!organization) {
      console.error('No organization found');
      process.exit(1);
    }

    // Create admin user
    let adminUser;
    try {
      adminUser = await storage.getUserByEmail('demo-admin@tasksetu.com');
      if (!adminUser) {
        const adminData = {
          firstName: 'Demo',
          lastName: 'Admin',
          email: 'demo-admin@tasksetu.com',
          password: 'admin123',
          role: 'admin',
          organization: organization._id,
          status: 'active',
          isActive: true,
          emailVerified: true,
          roles: ['admin']
        };
        adminUser = await storage.createUser(adminData);
        console.log('Created admin user:', adminUser.email);
      }
    } catch (adminError) {
      console.error('Admin creation error:', adminError);
      process.exit(1);
    }

    // Create sample invited and active users
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        roles: ['member'],
        organization: organization._id,
        status: 'invited',
        invitedBy: adminUser._id,
        isActive: false,
        emailVerified: false
      },
      {
        firstName: 'Jane',
        lastName: 'Smith', 
        email: 'jane.smith@example.com',
        roles: ['employee'],
        organization: organization._id,
        status: 'invited',
        invitedBy: adminUser._id,
        isActive: false,
        emailVerified: false
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        roles: ['member'],
        organization: organization._id,
        status: 'active',
        invitedBy: adminUser._id,
        isActive: true,
        emailVerified: true,
        password: 'user123'
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@example.com',
        roles: ['employee'],
        organization: organization._id,
        status: 'active',
        invitedBy: adminUser._id,
        isActive: true,
        emailVerified: true,
        password: 'user123'
      }
    ];

    for (const userData of sampleUsers) {
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (!existingUser) {
          await storage.createUser(userData);
          console.log(`Created ${userData.status} user:`, userData.email);
        } else {
          console.log(`User already exists:`, userData.email);
        }
      } catch (userError) {
        console.error(`Error creating user ${userData.email}:`, userError);
      }
    }

    console.log('\n=== Sample Data Created ===');
    console.log('Admin Login: demo-admin@tasksetu.com / admin123');
    console.log('Organization:', organization.name);
    console.log('Users created with invited and active statuses');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData();