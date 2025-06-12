import { storage } from './mongodb-storage.js';
import { authService } from './services/authService.js';

async function debugResetFlow() {
  console.log('Debugging password reset flow...\n');
  
  try {
    // Test with multiple users
    const testEmails = [
      'jane.smith@techcorp.com',
      'mike.johnson@techcorp.com', 
      'sarah.wilson@techcorp.com'
    ];
    
    for (const email of testEmails) {
      console.log(`\n=== Testing ${email} ===`);
      
      // 1. Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }
      console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
      
      // 2. Initiate password reset
      console.log('Initiating password reset...');
      await authService.forgotPassword(email);
      
      // 3. Check if reset token was stored
      const updatedUser = await storage.getUserByEmail(email);
      if (updatedUser.passwordResetToken) {
        console.log(`✅ Reset token stored: ${updatedUser.passwordResetToken.substring(0, 10)}...`);
        console.log(`✅ Token expires: ${updatedUser.passwordResetExpires}`);
        
        // 4. Test token validation
        try {
          const validationResult = await authService.validateResetToken(updatedUser.passwordResetToken);
          console.log(`✅ Token validation: ${validationResult.message}`);
        } catch (error) {
          console.log(`❌ Token validation failed: ${error.message}`);
        }
        
        // 5. Test password reset
        try {
          const resetResult = await authService.resetPassword(updatedUser.passwordResetToken, 'NewPassword123');
          console.log(`✅ Password reset: ${resetResult.message}`);
          
          // 6. Verify token was cleared
          const finalUser = await storage.getUserByEmail(email);
          if (!finalUser.passwordResetToken) {
            console.log(`✅ Reset token cleared after use`);
          } else {
            console.log(`❌ Reset token not cleared: ${finalUser.passwordResetToken}`);
          }
        } catch (error) {
          console.log(`❌ Password reset failed: ${error.message}`);
        }
        
      } else {
        console.log(`❌ Reset token not stored for ${email}`);
        console.log(`User data:`, {
          id: updatedUser._id,
          email: updatedUser.email,
          passwordResetToken: updatedUser.passwordResetToken,
          passwordResetExpires: updatedUser.passwordResetExpires
        });
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugResetFlow();