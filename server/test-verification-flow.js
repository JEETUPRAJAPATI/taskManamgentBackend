import { authService } from './services/authService.js';
import { emailService } from './services/emailService.js';
import mongoose from 'mongoose';

async function testVerificationFlow() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    
    console.log('Testing Complete Verification & Password Setup Flow');
    console.log('====================================================');
    
    // Step 1: Register a new user
    console.log('\n1. Registering new individual user...');
    const registrationResult = await authService.registerIndividual({
      email: 'test.verification@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('Registration result:', registrationResult.message);
    
    // Step 2: Get the verification code from database
    console.log('\n2. Getting verification code from database...');
    const { PendingUser } = await import('./models.js');
    const pendingUser = await PendingUser.findOne({ email: 'test.verification@example.com' });
    
    if (!pendingUser) {
      throw new Error('Pending user not found');
    }
    
    console.log('Verification code:', pendingUser.verificationCode);
    console.log('Expires:', pendingUser.verificationExpires);
    
    // Step 3: Test token verification endpoint
    console.log('\n3. Testing token verification...');
    const tokenResult = await authService.validateVerificationToken(pendingUser.verificationCode);
    console.log('Token validation result:', tokenResult);
    
    // Step 4: Test password setting
    console.log('\n4. Testing password setup...');
    const passwordResult = await authService.setPasswordWithToken(
      pendingUser.verificationCode,
      'SecurePassword123!'
    );
    console.log('Password setup result:', passwordResult.message);
    
    // Step 5: Test login with new credentials
    console.log('\n5. Testing login with new credentials...');
    const loginResult = await authService.login(
      'test.verification@example.com',
      'SecurePassword123!'
    );
    console.log('Login result:', loginResult.message);
    
    // Step 6: Cleanup - remove test user
    console.log('\n6. Cleaning up test data...');
    const { User } = await import('./models.js');
    await User.deleteOne({ email: 'test.verification@example.com' });
    console.log('Test user removed');
    
    console.log('\n✅ Complete verification flow test PASSED!');
    
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