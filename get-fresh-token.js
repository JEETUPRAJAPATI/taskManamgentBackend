import { storage } from './server/mongodb-storage.js';
import { generateToken } from './server/auth.js';

async function getLatestToken() {
  try {
    const users = await storage.getUsers();
    const user = users.find(u => u.email === 'org@gmail.com');
    
    if (!user) {
      console.log('User not found');
      return;
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      permissions: user.permissions || []
    };

    const token = generateToken(tokenPayload);
    console.log('Fresh token generated:');
    console.log(token);
    
    // Also show user data for verification
    console.log('\nUser data:');
    console.log({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

getLatestToken();