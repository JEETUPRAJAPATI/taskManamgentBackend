import { storage } from './server/mongodb-storage.js';

async function debugInvites() {
  try {
    
    // Find all invited users
    const { User } = await import('./server/models.js');
    const invitedUsers = await User.find({ status: 'invited' }).sort({ invitedAt: -1 }).limit(5);
    
    console.log('Recent invited users:');
    invitedUsers.forEach(user => {
      console.log({
        email: user.email,
        token: user.inviteToken,
        expires: user.inviteExpires,
        status: user.status,
        roles: user.roles,
        organizationId: user.organizationId
      });
    });
    
    if (invitedUsers.length > 0) {
      const testToken = invitedUsers[0].inviteToken;
      console.log('\nTesting token validation with:', testToken);
      
      // Test getUserByInviteToken
      const validatedUser = await storage.getUserByInviteToken(testToken);
      console.log('Validated user:', validatedUser ? 'Found' : 'Not found');
      
      if (validatedUser) {
        console.log('User details:', {
          email: validatedUser.email,
          roles: validatedUser.roles,
          organizationId: validatedUser.organizationId
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugInvites();