import { authService } from './services/authService.js';
import { MongoStorage } from './mongodb-storage.js';

const storage = new MongoStorage();

async function testResetTokenValidation() {
  try {
    console.log('Testing reset token validation flow...');
    
    // Step 1: Generate reset token
    const email = 'john.doe@techcorp.com';
    console.log(`\n1. Generating reset token for: ${email}`);
    await authService.forgotPassword(email);
    
    // Step 2: Get the user with reset token
    const user = await storage.getUserByEmail(email);
    if (!user || !user.resetPasswordToken) {
      console.log('No reset token found for user');
      return;
    }
    
    console.log('Reset token generated:', user.resetPasswordToken);
    console.log('Token expires:', user.resetPasswordExpires);
    console.log('Current time:', new Date());
    
    // Step 3: Test token validation
    console.log('\n2. Testing token validation...');
    try {
      const result = await authService.validateResetToken(user.resetPasswordToken);
      console.log('Validation result:', result);
      
      // Generate the reset URL
      const resetUrl = `http://localhost:5000/reset-password?token=${user.resetPasswordToken}`;
      console.log('\n✅ Valid reset URL:');
      console.log(resetUrl);
      
    } catch (error) {
      console.log('Validation failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  process.exit(0);
}

testResetTokenValidation();