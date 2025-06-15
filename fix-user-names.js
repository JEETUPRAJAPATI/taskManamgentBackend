import { storage } from './server/mongodb-storage.js';

async function fixUserNames() {
  try {
    console.log('Fetching all users...');
    const users = await storage.getUsers();
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.email}`);
      console.log(`Current firstName: "${user.firstName || 'EMPTY'}"`);
      console.log(`Current lastName: "${user.lastName || 'EMPTY'}"`);
      
      const updateData = {};
      let needsUpdate = false;
      
      if (!user.firstName || user.firstName.trim() === '') {
        if (user.email.includes('admin')) {
          updateData.firstName = 'Admin';
        } else if (user.email.includes('org')) {
          updateData.firstName = 'Organization';
        } else {
          updateData.firstName = 'User';
        }
        needsUpdate = true;
      }
      
      if (!user.lastName || user.lastName.trim() === '') {
        updateData.lastName = 'Manager';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Updating with: ${updateData.firstName} ${updateData.lastName}`);
        await storage.updateUser(user._id, updateData);
        console.log('✓ Updated successfully');
      } else {
        console.log('✓ No update needed');
      }
    }
    
    console.log('\n=== Verification ===');
    const updatedUsers = await storage.getUsers();
    updatedUsers.forEach(user => {
      console.log(`${user.email}: ${user.firstName} ${user.lastName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

fixUserNames();