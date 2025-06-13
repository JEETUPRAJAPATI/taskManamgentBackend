import mongoose from 'mongoose';

// Connect to MongoDB directly
async function testInviteFlow() {
  try {
    // Use the MongoDB URI from the running application
    await mongoose.connect('mongodb://localhost:27017/tasksetu');
    
    // Define user schema to query directly
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('TestUser', userSchema, 'users');
    
    // Find invited users
    const invitedUsers = await User.find({ status: 'invited' }).sort({ invitedAt: -1 }).limit(3);
    
    console.log(`Found ${invitedUsers.length} invited users:`);
    
    if (invitedUsers.length > 0) {
      const user = invitedUsers[0];
      console.log(`\nTesting with user: ${user.email}`);
      console.log(`Token: ${user.inviteToken}`);
      console.log(`Expires: ${user.inviteExpires}`);
      console.log(`Test URL: http://localhost:5000/accept-invite?token=${user.inviteToken}`);
      
      // Test API endpoint
      const response = await fetch(`http://localhost:5000/api/auth/validate-invite?token=${user.inviteToken}`);
      const result = await response.json();
      console.log('\nAPI Response:', result);
    } else {
      console.log('No invited users found. Creating a test invitation...');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testInviteFlow();