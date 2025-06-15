import mongoose from 'mongoose';

async function debugDatabase() {
  try {
    const mongoUrl = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(mongoUrl);
    
    console.log('Connected to MongoDB');

    // Check organizations
    const Organization = mongoose.model('Organization', new mongoose.Schema({}, { strict: false }));
    const organizations = await Organization.find({}).limit(5);
    console.log('\n=== Organizations ===');
    organizations.forEach(org => {
      console.log({
        _id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        isActive: org.isActive
      });
    });

    // Check users and their organization associations
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).limit(10);
    console.log('\n=== Users ===');
    users.forEach(user => {
      console.log({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization?.toString(),
        organizationId: user.organizationId?.toString(),
        status: user.status,
        isActive: user.isActive
      });
    });

    // Check specific admin user
    const adminUser = await User.findOne({ email: 'admin@demo.com' });
    console.log('\n=== Admin User Details ===');
    if (adminUser) {
      console.log({
        _id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        organization: adminUser.organization?.toString(),
        organizationId: adminUser.organizationId?.toString(),
        status: adminUser.status,
        isActive: adminUser.isActive,
        emailVerified: adminUser.emailVerified
      });

      // Check how many users are in the same organization
      const orgId = adminUser.organization || adminUser.organizationId;
      if (orgId) {
        const orgUsers = await User.find({
          $or: [
            { organization: orgId },
            { organizationId: orgId }
          ]
        });
        console.log(`\nUsers in admin's organization (${orgId}): ${orgUsers.length}`);
        orgUsers.slice(0, 5).forEach(user => {
          console.log(`  - ${user.email} (${user.role}, ${user.status})`);
        });
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugDatabase();