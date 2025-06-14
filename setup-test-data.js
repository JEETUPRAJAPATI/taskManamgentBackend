import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

// Connect and setup test data
async function setupTestData() {
  try {
    // Use existing connection or create new one
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/tasksetu');
    }

    // Define schemas inline to avoid import issues
    const organizationSchema = new mongoose.Schema({
      name: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      type: { type: String, enum: ['individual', 'company'], default: 'company' },
      status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
      settings: {
        allowPublicSignup: { type: Boolean, default: false },
        requireEmailVerification: { type: Boolean, default: true }
      }
    }, { timestamps: true });

    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: { type: String, required: true },
      passwordHash: String,
      role: { type: String, enum: ['super_admin', 'admin', 'member', 'employee'], default: 'member' },
      roles: [String],
      organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
      status: { type: String, enum: ['active', 'invited', 'inactive'], default: 'active' },
      isActive: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      inviteToken: String,
      inviteTokenExpiry: Date,
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      invitedAt: Date,
      lastLoginAt: Date
    }, { timestamps: true });

    const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Create organization
    let org = await Organization.findOne({ slug: 'tasksetu-demo' });
    if (!org) {
      org = new Organization({
        name: 'TaskSetu Demo',
        slug: 'tasksetu-demo',
        type: 'company',
        status: 'active',
        settings: {
          allowPublicSignup: false,
          requireEmailVerification: true
        }
      });
      await org.save();
      console.log('✓ Created organization:', org.name);
    } else {
      console.log('✓ Organization exists:', org.name);
    }

    // Create admin user
    let admin = await User.findOne({ email: 'admin@demo.com' });
    if (!admin) {
      const passwordHash = await bcryptjs.hash('admin123', 10);
      
      admin = new User({
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'admin@demo.com',
        passwordHash,
        role: 'admin',
        roles: ['admin'],
        organization: org._id,
        status: 'active',
        isActive: true,
        emailVerified: true
      });
      await admin.save();
      console.log('✓ Created admin user:', admin.email);
    } else {
      console.log('✓ Admin user exists:', admin.email);
    }

    // Create sample invited users
    const invitations = [
      { email: 'user1@demo.com', roles: ['member'] },
      { email: 'user2@demo.com', roles: ['member'] },
      { email: 'manager@demo.com', roles: ['admin'] }
    ];

    for (const invite of invitations) {
      const existingUser = await User.findOne({ 
        email: invite.email, 
        organization: org._id 
      });
      
      if (!existingUser) {
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const invitedUser = new User({
          email: invite.email,
          role: invite.roles.includes('admin') ? 'admin' : 'member',
          roles: invite.roles,
          organization: org._id,
          status: 'invited',
          isActive: false,
          emailVerified: false,
          inviteToken,
          inviteTokenExpiry,
          invitedBy: admin._id,
          invitedAt: new Date()
        });

        await invitedUser.save();
        console.log('✓ Created invitation for:', invite.email);
      } else {
        console.log('✓ User already exists:', invite.email);
      }
    }

    // Display all users in organization
    const allUsers = await User.find({ organization: org._id })
      .select('firstName lastName email roles status isActive')
      .sort({ createdAt: -1 });

    console.log('\n📊 Organization Users:');
    allUsers.forEach(user => {
      const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Not Set';
      console.log(`  - ${user.email} | ${name} | Status: ${user.status} | Roles: ${user.roles || [user.role]}`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: admin123');
    console.log(`  Organization ID: ${org._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestData();