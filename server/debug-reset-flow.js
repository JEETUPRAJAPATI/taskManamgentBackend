import { authService } from './services/authService.js';
import { storage } from './mongodb-storage.js';

async function debugResetFlow() {
  console.log('=== PASSWORD RESET FLOW DEBUG ===\n');
  
  const email = 'john.doe@techcorp.com';
  
  // Step 1: Check initial user state
  console.log('1. Checking initial user state...');
  let user = await storage.getUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', user.email);
  console.log('Initial reset token:', user.passwordResetToken || 'None');
  console.log('Initial token expiry:', user.passwordResetExpires || 'None');
  
  // Step 2: Test token generation
  console.log('\n2. Testing token generation...');
  const testToken = authService.generateResetToken();
  console.log('Generated test token:', testToken);
  console.log('Token length:', testToken.length);
  
  // Step 3: Test direct storage update
  console.log('\n3. Testing direct storage update...');
  const newToken = authService.generateResetToken();
  const newExpiry = new Date(Date.now() + 3600000);
  
  console.log('Updating user with token:', newToken);
  console.log('Token expiry:', newExpiry);
  
  await storage.updateUser(user._id, {
    passwordResetToken: newToken,
    passwordResetExpires: newExpiry
  });
  
  // Step 4: Verify storage
  console.log('\n4. Verifying storage...');
  user = await storage.getUserByEmail(email);
  console.log('Stored token:', user.passwordResetToken);
  console.log('Stored expiry:', user.passwordResetExpires);
  console.log('Token matches:', user.passwordResetToken === newToken);
  console.log('Expiry matches:', user.passwordResetExpires?.getTime() === newExpiry.getTime());
  
  // Step 5: Test token retrieval
  console.log('\n5. Testing token retrieval...');
  if (user.passwordResetToken) {
    const retrievedUser = await storage.getUserByResetToken(user.passwordResetToken);
    console.log('Token retrieval successful:', !!retrievedUser);
    
    if (retrievedUser) {
      console.log('Retrieved user email:', retrievedUser.email);
      console.log('✅ Complete flow working correctly');
      console.log('Valid reset URL:', `http://localhost:5000/reset-password?token=${user.passwordResetToken}`);
      
      // Test the validation endpoint
      console.log('\n6. Testing validation endpoint...');
      try {
        const result = await authService.validateResetToken(user.passwordResetToken);
        console.log('✅ Token validation successful:', result.message);
      } catch (error) {
        console.log('❌ Token validation failed:', error.message);
      }
    } else {
      console.log('❌ Token retrieval failed');
    }
  } else {
    console.log('❌ No token stored');
  }
  
  process.exit(0);
}

debugResetFlow();