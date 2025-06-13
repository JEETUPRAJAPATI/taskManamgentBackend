import { storage } from './server/mongodb-storage.js';

async function testNewInvite() {
  try {
    // Create test invitation with correct field names
    const inviteData = {
      emails: ['test-user@example.com'],
      roles: ['member'],
      organizationId: '507f1f77bcf86cd799439011', // Test org ID
      invitedBy: '507f1f77bcf86cd799439012' // Test admin ID
    };

    console.log('Creating new invitation...');
    const result = await storage.inviteUserToOrganization(inviteData);
    
    if (result) {
      console.log('Invitation created successfully');
      console.log('Email:', result.email);
      console.log('Token:', result.inviteToken);
      console.log('Test URL:', `http://localhost:5000/accept-invite?token=${result.inviteToken}`);
      
      // Test token validation
      const validationResult = await storage.getUserByInviteToken(result.inviteToken);
      console.log('Token validation:', validationResult ? 'SUCCESS' : 'FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testNewInvite();