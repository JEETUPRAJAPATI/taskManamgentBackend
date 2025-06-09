import { emailService } from './services/emailService.js';

async function testEmailService() {
  console.log('Testing Mailtrap Email Service...');
  
  // Test if service is configured
  console.log('Email service configured:', emailService.isEmailServiceAvailable());
  
  try {
    // Test verification email
    console.log('\nTesting verification email...');
    const verificationResult = await emailService.sendVerificationEmail(
      'techizebuilder@gmail.com',
      '123456',
      'Test User',
      'Test Organization'
    );
    console.log('Verification email result:', verificationResult);
    
    // Test password reset email
    console.log('\nTesting password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123',
      'Test User'
    );
    console.log('Password reset email result:', resetResult);
    
    // Test invitation email
    console.log('\nTesting invitation email...');
    const inviteResult = await emailService.sendInvitationEmail(
      'test@example.com',
      'test-invite-token-123',
      'Test Organization',
      ['admin', 'member'],
      'John Doe'
    );
    console.log('Invitation email result:', inviteResult);
    
  } catch (error) {
    console.error('Email service test failed:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailService();
}

export { testEmailService };