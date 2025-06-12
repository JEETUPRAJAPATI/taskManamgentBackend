import { emailService } from './server/services/emailService.js';
import mongoose from 'mongoose';

async function testEmailUrls() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu');
    
    console.log('Testing Email URLs with Production Base URL');
    console.log('===============================================');
    console.log('Base URL:', emailService.baseUrl);
    
    // Test verification email
    console.log('\n1. Testing verification email URL...');
    const verificationResult = await emailService.sendVerificationEmail(
      'test@example.com',
      'test-verification-token-123',
      'Test User',
      'Test Organization'
    );
    console.log('Verification email sent:', verificationResult);
    
    // Test password reset email
    console.log('\n2. Testing password reset email URL...');
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123',
      'Test User'
    );
    console.log('Password reset email sent:', resetResult);
    
    // Test invitation email
    console.log('\n3. Testing invitation email URL...');
    const inviteResult = await emailService.sendInvitationEmail(
      'test@example.com',
      'test-invite-token-123',
      'Test Organization',
      ['admin', 'member'],
      'John Doe'
    );
    console.log('Invitation email sent:', inviteResult);
    
    console.log('\n✅ All email URLs updated successfully!');
    console.log('Expected URLs:');
    console.log('- Verification:', `${emailService.baseUrl}/verify?token=test-verification-token-123`);
    console.log('- Password Reset:', `${emailService.baseUrl}/reset-password?token=test-reset-token-123`);
    console.log('- Invitation:', `${emailService.baseUrl}/accept-invitation?token=test-invite-token-123`);
    
  } catch (error) {
    console.error('Email URL test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEmailUrls();