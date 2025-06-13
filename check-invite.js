import mongoose from 'mongoose';
import './server/models.js';

const User = mongoose.model('User');

async function checkInvites() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    
    const invitedUsers = await User.find({ status: 'invited' }).sort({ invitedAt: -1 }).limit(3);
    
    console.log(`Found ${invitedUsers.length} invited users:`);
    
    invitedUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`);
      console.log(`   Token: ${user.inviteToken}`);
      console.log(`   Expires: ${user.inviteExpires}`);
      console.log(`   Organization: ${user.organizationId}`);
      console.log(`   Test URL: http://localhost:5000/accept-invite?token=${user.inviteToken}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInvites();