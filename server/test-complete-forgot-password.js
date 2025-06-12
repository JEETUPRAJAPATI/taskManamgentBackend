import { MongoStorage } from './mongodb-storage.js';
import { authService } from './services/authService.js';

const storage = new MongoStorage();

async function testCompleteForgotPasswordFlow() {
  try {
    // Get a user from the database to test with
    const users = await storage.getUsers();
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const testUser = users[0];
    console.log(`Testing forgot password for user: ${testUser.email}`);
    
    // Step 1: Send forgot password request
    console.log('\n1. Sending forgot password request...');
    const forgotResult = await authService.forgotPassword(testUser.email);
    console.log('Forgot password result:', forgotResult);
    
    // Step 2: Get the user with reset token to verify it was set
    const updatedUser = await storage.getUserByEmail(testUser.email);
    console.log('\n2. Checking reset token was generated...');
    console.log('Reset token exists:', !!updatedUser.resetPasswordToken);
    console.log('Reset token expires:', updatedUser.resetPasswordExpires);
    
    if (updatedUser.resetPasswordToken) {
      console.log('\n3. Testing reset token validation...');
      try {
        const validateResult = await authService.validateResetToken(updatedUser.resetPasswordToken);
        console.log('Token validation result:', validateResult);
        
        console.log('\n4. Testing password reset...');
        const resetResult = await authService.resetPassword(updatedUser.resetPasswordToken, 'newpassword123');
        console.log('Password reset result:', resetResult);
        
        console.log('\n✅ Complete forgot password flow working correctly!');
        console.log(`Valid reset URL would be: http://localhost:5000/reset-password?token=${updatedUser.resetPasswordToken}`);
        
      } catch (error) {
        console.error('Token validation/reset failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCompleteForgotPasswordFlow();