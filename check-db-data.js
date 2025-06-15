import { storage } from './server/mongodb-storage.js';

async function checkData() {
  try {
    console.log('=== Checking Database User Data ===');
    const users = await storage.getUsers();
    
    console.log(`Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`First Name: "${user.firstName || 'EMPTY/NULL'}"`);
      console.log(`Last Name: "${user.lastName || 'EMPTY/NULL'}"`);
      console.log(`Profile Image: "${user.profileImageUrl || 'EMPTY/NULL'}"`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      
      // Check if the fields exist as properties
      console.log(`Has firstName property: ${user.hasOwnProperty('firstName')}`);
      console.log(`Has lastName property: ${user.hasOwnProperty('lastName')}`);
    });
    
    // Check a specific user by email if exists
    const testUser = users.find(u => u.email === 'org@gmail.com');
    if (testUser) {
      console.log('\n=== Detailed check for org@gmail.com ===');
      console.log('Raw user object keys:', Object.keys(testUser.toObject()));
      console.log('User data:', JSON.stringify(testUser.toObject(), null, 2));
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
  process.exit(0);
}

checkData();