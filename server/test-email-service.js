import { emailService } from './services/emailService.js';

async function testEmailService() {
  console.log('Testing email service...');
  console.log('Email service configured:', emailService.isEmailServiceAvailable());
  
  try {
    const result = await emailService.sendPasswordResetEmail(
      'techizebuilder@gmail.com',
      'test-reset-token-123',
      'Test User'
    );
    
    console.log('Email send result:', result);
    
    if (result) {
      console.log('✅ Password reset email sent successfully!');
    } else {
      console.log('❌ Failed to send password reset email');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

testEmailService();