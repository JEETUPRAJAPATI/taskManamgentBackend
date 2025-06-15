import { storage } from './server/mongodb-storage.js';

async function debugProfile() {
  try {
    console.log('Checking user profiles...');
    const users = await storage.getUsers();
    
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  firstName: ${user.firstName || 'NOT SET'}`);
      console.log(`  lastName: ${user.lastName || 'NOT SET'}`);
      console.log(`  profileImageUrl: ${user.profileImageUrl || 'NOT SET'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

debugProfile();