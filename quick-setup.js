import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Import models
import './server/models.js';

async function quickSetup() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    const User = mongoose.model('User');
    const Organization = mongoose.model('Organization');
    
    // Clear existing test data
    await User.deleteMany({ email: { $in: ['admin@test.com', 'invited1@test.com', 'invited2@test.com'] } });
    await Organization.deleteOne({ slug: 'test-org' });
    
    // Create organization
    const org = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      type: 'company',
      status: 'active'
    });
    
    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      passwordHash: adminHash,
      role: 'admin',
      organization: org._id,
      status: 'active',
      isActive: true,
      emailVerified: true
    });
    
    // Create invited users
    const inviteToken1 = crypto.randomBytes(32).toString('hex');
    const inviteToken2 = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    const invited1 = await User.create({
      email: 'invited1@test.com',
      role: 'member',
      organization: org._id,
      status: 'invited',
      isActive: false,
      emailVerified: false,
      inviteToken: inviteToken1,
      inviteTokenExpiry: inviteExpiry,
      invitedBy: admin._id,
      invitedAt: new Date()
    });
    
    const invited2 = await User.create({
      email: 'invited2@test.com',
      role: 'member',
      organization: org._id,
      status: 'invited',
      isActive: false,
      emailVerified: false,
      inviteToken: inviteToken2,
      inviteTokenExpiry: inviteExpiry,
      invitedBy: admin._id,
      invitedAt: new Date()
    });
    
    console.log('✓ Created organization:', org.name);
    console.log('✓ Created admin user:', admin.email);
    console.log('✓ Created invited users:', invited1.email, invited2.email);
    console.log('Login: admin@test.com / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

quickSetup();