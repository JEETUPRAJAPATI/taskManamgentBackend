import mongoose from 'mongoose';
import { storage } from './server/mongodb-storage.js';

async function checkData() {
  try {
    const dbUrl = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
    
    // Get all organizations
    const orgs = await mongoose.model('Organization').find({}).select('_id name slug type status');
    console.log('\n=== ORGANIZATIONS ===');
    orgs.forEach(org => {
      console.log(`ID: ${org._id}, Name: ${org.name}, Slug: ${org.slug}, Status: ${org.status}`);
    });
    
    // Get all users with their organization info
    const users = await mongoose.model('User').find({}).select('_id email firstName lastName organization status roles inviteToken createdAt');
    console.log('\n=== USERS ===');
    users.forEach(user => {
      console.log(`Email: ${user.email}, Org: ${user.organization}, Status: ${user.status}, Roles: ${user.roles}, HasInviteToken: ${!!user.inviteToken}`);
    });
    
    // Check for pending users
    const pendingUsers = await mongoose.model('PendingUser').find({}).select('email organizationId status verificationCode');
    console.log('\n=== PENDING USERS ===');
    pendingUsers.forEach(user => {
      console.log(`Email: ${user.email}, Org: ${user.organizationId}, Status: ${user.status}, HasCode: ${!!user.verificationCode}`);
    });
    
    // Check if there's an admin user and their organization
    const adminUser = await mongoose.model('User').findOne({ email: 'admin@demo.com' });
    if (adminUser) {
      console.log('\n=== ADMIN USER INFO ===');
      console.log(`Admin Email: ${adminUser.email}`);
      console.log(`Admin Organization: ${adminUser.organization}`);
      console.log(`Admin Role: ${adminUser.role || adminUser.roles}`);
      
      // Get users from admin's organization
      if (adminUser.organization) {
        const orgUsers = await mongoose.model('User').find({ organization: adminUser.organization });
        console.log(`\n=== USERS IN ADMIN'S ORGANIZATION (${adminUser.organization}) ===`);
        orgUsers.forEach(user => {
          console.log(`Email: ${user.email}, Status: ${user.status}, Roles: ${user.roles || user.role}, Created: ${user.createdAt}`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();