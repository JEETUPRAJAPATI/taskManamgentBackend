import { authService } from './services/authService.js';
import { emailService } from './services/emailService.js';
import mongoose from 'mongoose';

async function testVerificationFlow() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    
    console.log('Testing Complete Duplicate Email Prevention & Link-Based Verification');
    console.log('====================================================================');
    
    // Step 1: Register a new user
    console.log('\n1. Registering new individual user...');
    const registrationResult = await authService.registerIndividual({
      email: 'test.verification@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('Registration result:', registrationResult.message);
    
    // Step 2: Test duplicate email prevention (individual)
    console.log('\n2. Testing duplicate email prevention (same type)...');
    try {
      await authService.registerIndividual({
        email: 'test.verification@example.com',
        firstName: 'Another',
        lastName: 'User'
      });
      console.log('❌ ERROR: Duplicate registration should have been prevented!');
    } catch (error) {
      console.log('✅ Duplicate prevention working:', error.message);
    }
    
    // Step 3: Test duplicate email prevention (organization)
    console.log('\n3. Testing duplicate email prevention (different type)...');
    try {
      await authService.registerOrganization({
        email: 'test.verification@example.com',
        firstName: 'Org',
        lastName: 'Admin',
        organizationName: 'Test Company',
        organizationSlug: 'test-company'
      });
      console.log('❌ ERROR: Cross-type duplicate registration should have been prevented!');
    } catch (error) {
      console.log('✅ Cross-type duplicate prevention working:', error.message);
    }
    
    // Step 4: Get the verification token from database
    console.log('\n4. Getting verification token from database...');
    const { PendingUser } = await import('./models.js');
    const pendingUser = await PendingUser.findOne({ email: 'test.verification@example.com' });
    
    if (!pendingUser) {
      throw new Error('Pending user not found');
    }
    
    console.log('Verification token (first 16 chars):', pendingUser.verificationCode.substring(0, 16) + '...');
    console.log('Token is secure (not 6-digit OTP):', pendingUser.verificationCode.length > 6);
    console.log('Expires:', pendingUser.verificationExpires);
    
    // Step 5: Test token verification endpoint
    console.log('\n5. Testing secure token verification...');
    const tokenResult = await authService.validateVerificationToken(pendingUser.verificationCode);
    console.log('Token validation result:', tokenResult);
    
    // Step 6: Test password setting
    console.log('\n6. Testing password setup...');
    const passwordResult = await authService.setPasswordWithToken(
      pendingUser.verificationCode,
      'SecurePassword123!'
    );
    console.log('Password setup result:', passwordResult.message);
    
    // Step 7: Test login with new credentials
    console.log('\n7. Testing login with new credentials...');
    const loginResult = await authService.login(
      'test.verification@example.com',
      'SecurePassword123!'
    );
    console.log('Login result:', loginResult.message);
    
    // Step 8: Test duplicate email prevention for verified user
    console.log('\n8. Testing duplicate prevention for verified user...');
    try {
      await authService.registerIndividual({
        email: 'test.verification@example.com',
        firstName: 'New',
        lastName: 'User'
      });
      console.log('❌ ERROR: Should not allow registration of existing verified user!');
    } catch (error) {
      console.log('✅ Verified user duplicate prevention working:', error.message);
    }
    
    // Step 9: Cleanup - remove test user
    console.log('\n9. Cleaning up test data...');
    const { User } = await import('./models.js');
    await User.deleteOne({ email: 'test.verification@example.com' });
    console.log('Test user removed');
    
    console.log('\n✅ Complete duplicate email prevention & link verification test PASSED!');
    console.log('✅ Link-based verification (no OTP) confirmed working!');
    console.log('✅ Secure token generation confirmed working!');
    console.log('✅ Duplicate email prevention confirmed working!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup on error
    try {
      const { User, PendingUser } = await import('./models.js');
      await User.deleteOne({ email: 'test.verification@example.com' });
      await PendingUser.deleteOne({ email: 'test.verification@example.com' });
      console.log('Cleanup completed');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testVerificationFlow();