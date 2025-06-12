import { authService } from './services/authService.js';
import { MongoStorage } from './mongodb-storage.js';

const storage = new MongoStorage();

async function generateValidResetLink() {
  try {
    console.log('Generating valid reset link...');
    
    // Get the first user from the database
    const users = await storage.getUsers();
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const testUser = users[0];
    console.log(`Using user: ${testUser.email}`);
    
    // Trigger forgot password to generate a valid reset token
    await authService.forgotPassword(testUser.email);
    
    // Get the updated user with the reset token
    const updatedUser = await storage.getUserByEmail(testUser.email);
    
    if (updatedUser.resetPasswordToken) {
      const resetUrl = `http://localhost:5000/reset-password?token=${updatedUser.resetPasswordToken}`;
      console.log('\n✅ Valid reset link generated:');
      console.log(resetUrl);
      console.log('\nToken expires:', updatedUser.resetPasswordExpires);
    } else {
      console.log('Failed to generate reset token');
    }
    
  } catch (error) {
    console.error('Error generating reset link:', error.message);
  }
  
  process.exit(0);
}

generateValidResetLink();