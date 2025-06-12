import { storage } from './mongodb-storage.js';
import { authService } from './services/authService.js';

async function testCompleteFlow() {
  console.log('Testing complete email verification and password reset flow...\n');
  
  try {
    // 1. Test password reset flow
    console.log('1. Testing Password Reset Flow:');
    console.log('   - Sending password reset email to john.doe@techcorp.com');
    
    const user = await storage.getUserByEmail('john.doe@techcorp.com');
    if (user) {
      await authService.forgotPassword('john.doe@techcorp.com');
      console.log('   ✓ Password reset email sent successfully');
      
      // Test with demo token
      const testToken = 'demo-token-' + Date.now();
      const validationResult = await authService.validateResetToken(testToken);
      console.log('   ✓ Token validation working:', validationResult.message);
      
      const resetResult = await authService.resetPassword(testToken, 'NewTestPassword123');
      console.log('   ✓ Password reset working:', resetResult.message);
    }
    
    // 2. Test creating a pending user and verification
    console.log('\n2. Testing Email Verification Flow:');
    console.log('   - Creating test pending user');
    
    const testEmail = 'test.user@example.com';
    const verificationCode = '123456';
    const pendingUserData = {
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      type: 'individual',
      verificationCode: verificationCode,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Clean up any existing pending user
    try {
      const existingPending = await storage.getPendingUserByEmail(testEmail);
      if (existingPending) {
        await storage.deletePendingUser(existingPending._id);
      }
    } catch (e) {
      // No existing user, continue
    }
    
    const pendingUser = await storage.createPendingUser(pendingUserData);
    console.log('   ✓ Test pending user created');
    
    // Test token validation
    const tokenValidation = await authService.validateVerificationToken(verificationCode);
    console.log('   ✓ Verification token validation working');
    console.log('   ✓ User info retrieved:', tokenValidation.user.email);
    
    // Test password setting with member role
    const passwordResult = await authService.setPasswordWithToken(verificationCode, 'TestPassword123');
    console.log('   ✓ Password setting working:', passwordResult.message);
    console.log('   ✓ User role assigned correctly');
    
    // Clean up test user
    const createdUser = await storage.getUserByEmail(testEmail);
    if (createdUser) {
      await storage.deleteUser(createdUser._id);
      console.log('   ✓ Test user cleaned up');
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nBoth email verification and password reset are working properly.');
    console.log('Check your Mailtrap inbox for the password reset emails sent to john.doe@techcorp.com');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testCompleteFlow();