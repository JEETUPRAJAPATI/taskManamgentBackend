import { storage } from './server/mongodb-storage.js';

async function updateTestUser() {
  try {
    console.log('Finding users...');
    const users = await storage.getUsers();
    const testUser = users.find(user => user.email === 'org@gmail.com');
    
    if (testUser) {
      console.log('Found user:', testUser.email);
      console.log('Current firstName:', testUser.firstName);
      console.log('Current lastName:', testUser.lastName);
      
      // Update with sample data if empty
      const updateData = {
        firstName: testUser.firstName || 'John',
        lastName: testUser.lastName || 'Admin'
      };
      
      console.log('Updating user with:', updateData);
      const updatedUser = await storage.updateUser(testUser._id, updateData);
      console.log('Updated user:', {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

updateTestUser();