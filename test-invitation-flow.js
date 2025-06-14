import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import './server/models.js';

const { User, Organization } = mongoose.models;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testInvitationFlow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    // Create or find organization
    let organization = await Organization.findOne({ name: 'Test Company' });
    if (!organization) {
      organization = new Organization({
        name: 'Test Company',
        slug: 'test-company',
        type: 'company',
        status: 'active',
        settings: {
          allowPublicSignup: false,
          requireEmailVerification: true
        }
      });
      await organization.save();
      console.log('Created organization:', organization.name);
    }

    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@test.com' });
    if (!adminUser) {
      const passwordHash = await bcryptjs.hash('admin123', 10);
      
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        passwordHash,
        role: 'admin',
        organization: organization._id,
        status: 'active',
        isActive: true,
        emailVerified: true,
        roles: ['admin']
      });
      await adminUser.save();
      console.log('Created admin user:', adminUser.email);
    }

    // Generate JWT token for admin
    const token = jwt.sign({
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      organizationId: organization._id
    }, JWT_SECRET);

    console.log('Admin login token:', token);
    console.log('Organization ID:', organization._id);
    
    // Test invitation creation
    const inviteToken = Math.random().toString(36).substring(2);
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitedUser = new User({
      email: 'invited@test.com',
      role: 'member',
      roles: ['member'],
      organization: organization._id,
      status: 'invited',
      isActive: false,
      emailVerified: false,
      inviteToken,
      inviteTokenExpiry,
      invitedBy: adminUser._id,
      invitedAt: new Date()
    });

    await invitedUser.save();
    console.log('Created invited user:', invitedUser.email);

    // Fetch all organization users
    const orgUsers = await User.find({ organization: organization._id })
      .select('firstName lastName email roles status isActive emailVerified inviteToken inviteTokenExpiry lastLoginAt createdAt invitedBy invitedAt')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('\nOrganization Users:');
    orgUsers.forEach(user => {
      console.log(`- ${user.email} | Status: ${user.status} | Role: ${user.role} | Roles: ${user.roles}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInvitationFlow();