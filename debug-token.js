import { storage } from './server/mongodb-storage.js';
import { User } from './server/models.js';

async function debugToken() {
  try {
    const testToken = "cface5f1df24d68bfd9f29457b6cd00eb001dc729b0a437b10faf8a2e97b955e";
    
    console.log('Searching for token:', testToken);
    
    // Direct MongoDB query to check all fields
    const directResult = await User.findOne({ inviteToken: testToken });
    console.log('Direct query result:', directResult ? {
      email: directResult.email,
      status: directResult.status,
      inviteToken: directResult.inviteToken,
      inviteExpires: directResult.inviteExpires,
      inviteTokenExpiry: directResult.inviteTokenExpiry,
      organizationId: directResult.organizationId,
      organization: directResult.organization
    } : 'Not found');
    
    // Check all invited users
    const allInvited = await User.find({ status: 'invited' }).limit(5);
    console.log('\nAll invited users:');
    allInvited.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} - Token: ${user.inviteToken} - Expires: ${user.inviteExpires}`);
    });
    
    // Test storage method
    const storageResult = await storage.getUserByInviteToken(testToken);
    console.log('\nStorage method result:', storageResult ? 'Found' : 'Not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugToken();