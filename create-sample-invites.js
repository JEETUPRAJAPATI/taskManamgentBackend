import mongoose from 'mongoose';
import './server/models.js';
import { storage } from './server/mongodb-storage.js';

const User = mongoose.model('User');
const Organization = mongoose.model('Organization');

async function createSampleInvites() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    console.log('Connected to MongoDB');

    // Get the first organization (TechCorp)
    const organization = await Organization.findOne({ name: 'TechCorp Solutions' });
    if (!organization) {
      console.log('No organization found. Please run sample data initialization first.');
      process.exit(1);
    }

    console.log(`Creating sample invites for organization: ${organization.name}`);

    // Get the admin user who will be the inviter
    const adminUser = await User.findOne({ 
      organization: organization._id, 
      role: { $in: ['org_admin', 'admin'] }
    });

    if (!adminUser) {
      console.log('No admin user found in organization');
      process.exit(1);
    }

    // Sample invitation data
    const sampleInvites = [
      {
        email: 'jane.doe@example.com',
        roles: ['member'],
        organizationId: organization._id,
        invitedBy: adminUser._id,
        invitedByName: `${adminUser.firstName} ${adminUser.lastName}`,
        organizationName: organization.name
      },
      {
        email: 'john.smith@example.com',
        roles: ['member', 'manager'],
        organizationId: organization._id,
        invitedBy: adminUser._id,
        invitedByName: `${adminUser.firstName} ${adminUser.lastName}`,
        organizationName: organization.name
      }
    ];

    // Create invitations
    for (const inviteData of sampleInvites) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: inviteData.email,
          organization: organization._id 
        });

        if (existingUser) {
          console.log(`User ${inviteData.email} already exists, skipping...`);
          continue;
        }

        // Create the invitation
        const invitedUser = await storage.inviteUserToOrganization(inviteData);
        console.log(`✓ Created invitation for ${inviteData.email} with roles: ${inviteData.roles.join(', ')}`);
        console.log(`  Token: ${invitedUser.inviteToken}`);
        console.log(`  Expires: ${invitedUser.inviteTokenExpiry}`);
        console.log(`  Test URL: http://localhost:5000/accept-invite?token=${invitedUser.inviteToken}`);
      } catch (error) {
        console.error(`Failed to create invite for ${inviteData.email}:`, error.message);
      }
    }

    // Show current organization users
    const allUsers = await storage.getOrganizationUsersDetailed(organization._id);
    console.log('\n📊 Current organization users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Status: ${user.status} - Roles: ${user.roles || [user.role]}`);
    });

    console.log('\n✅ Sample invitation data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample invites:', error);
    process.exit(1);
  }
}

createSampleInvites();