import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import './server/models.js';

const { User, Organization } = mongoose.models;

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@tasksetu.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      const org = await Organization.findById(existingAdmin.organization);
      console.log('Organization:', org?.name);
      process.exit(0);
    }

    // Create or find organization
    let organization = await Organization.findOne({ name: 'TaskSetu Inc' });
    if (!organization) {
      organization = new Organization({
        name: 'TaskSetu Inc',
        slug: 'tasksetu-inc',
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

    // Create admin user
    const passwordHash = await bcryptjs.hash('admin123', 10);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tasksetu.com',
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
    console.log('Password: admin123');
    console.log('Organization ID:', organization._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();