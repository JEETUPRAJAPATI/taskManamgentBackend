import mongoose from 'mongoose';
import './server/models.js';

async function quickSetup() {
  await mongoose.connect('mongodb://localhost:27017/tasksetu');
  
  const Organization = mongoose.model('Organization');
  const User = mongoose.model('User');
  
  // Get or create organization
  let org = await Organization.findOne();
  if (!org) {
    org = await Organization.create({
      name: 'Demo Company',
      slug: 'demo-company',
      type: 'company',
      status: 'active'
    });
  }
  
  // Create admin user with known ID
  const adminId = new mongoose.Types.ObjectId();
  await User.deleteOne({ email: 'admin@demo.com' });
  await User.create({
    _id: adminId,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@demo.com',
    passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', // hash for 'secret'
    role: 'admin',
    organization: org._id,
    status: 'active',
    isActive: true,
    emailVerified: true,
    roles: ['admin']
  });
  
  // Create test users
  await User.deleteMany({ email: { $in: ['john@test.com', 'jane@test.com', 'mike@test.com'] } });
  
  const testUsers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      passwordHash: 'temp_invite_placeholder',
      role: 'member',
      organization: org._id,
      status: 'invited',
      invitedBy: adminId,
      invitedAt: new Date(),
      isActive: false,
      emailVerified: false
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      passwordHash: 'temp_invite_placeholder',
      role: 'employee',
      organization: org._id,
      status: 'invited',
      invitedBy: adminId,
      invitedAt: new Date(),
      isActive: false,
      emailVerified: false
    },
    {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike@test.com',
      passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
      role: 'member',
      organization: org._id,
      status: 'active',
      invitedBy: adminId,
      invitedAt: new Date(Date.now() - 86400000),
      isActive: true,
      emailVerified: true
    }
  ];
  
  await User.insertMany(testUsers);
  
  console.log('Setup complete!');
  console.log('Admin: admin@demo.com / secret');
  console.log('Organization ID:', org._id.toString());
  
  process.exit(0);
}

quickSetup().catch(console.error);