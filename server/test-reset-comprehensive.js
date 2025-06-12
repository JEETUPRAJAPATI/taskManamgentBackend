import { storage } from './mongodb-storage.js';
import { authService } from './services/authService.js';

async function testResetComprehensive() {
  console.log('Testing password reset for all users...\n');
  
  try {
    // Get all users
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users in database\n`);
    
    // Test with first 3 users
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      console.log(`\n--- Testing user: ${user.email} ---`);
      
      // Step 1: Initiate password reset
      console.log('1. Initiating password reset...');
      await authService.forgotPassword(user.email);
      
      // Step 2: Check if token was stored
      const userAfterReset = await storage.getUserByEmail(user.email);
      console.log('2. Token storage check:');
      console.log(`   Token: ${userAfterReset.passwordResetToken ? 'STORED' : 'NOT STORED'}`);
      console.log(`   Expires: ${userAfterReset.passwordResetExpires || 'NOT SET'}`);
      
      if (userAfterReset.passwordResetToken) {
        // Step 3: Test token retrieval
        console.log('3. Testing token retrieval...');
        const foundUser = await storage.getUserByResetToken(userAfterReset.passwordResetToken);
        if (foundUser) {
          console.log('   getUserByResetToken: SUCCESS');
          
          // Step 4: Test password reset
          console.log('4. Testing password reset...');
          try {
            const result = await authService.resetPassword(userAfterReset.passwordResetToken, 'TestPassword123');
            console.log(`   Reset result: ${result.message}`);
            
            // Step 5: Verify token was cleared
            const finalUser = await storage.getUserByEmail(user.email);
            console.log(`   Token cleared: ${!finalUser.passwordResetToken ? 'YES' : 'NO'}`);
            
          } catch (error) {
            console.log(`   Reset failed: ${error.message}`);
          }
        } else {
          console.log('   getUserByResetToken: FAILED');
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('Password reset functionality tested for multiple users');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testResetComprehensive();