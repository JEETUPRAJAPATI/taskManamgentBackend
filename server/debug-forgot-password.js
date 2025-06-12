import { MongoStorage } from './mongodb-storage.js';
import { authService } from './services/authService.js';

const storage = new MongoStorage();

async function debugForgotPassword() {
  try {
    // Get sample users from database
    const users = await storage.getUsers();
    console.log('Available users in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\nTesting forgot password with: ${testUser.email}`);
      
      // Test forgot password flow
      const result = await authService.forgotPassword(testUser.email);
      console.log('Forgot password result:', result);
      
      // Check if reset token was set
      const updatedUser = await storage.getUserByEmail(testUser.email);
      console.log('Reset token set:', !!updatedUser.resetPasswordToken);
      console.log('Reset token expires:', updatedUser.resetPasswordExpires);
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
  process.exit(0);
}

debugForgotPassword();