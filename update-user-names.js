import mongoose from 'mongoose';
import { User } from './server/models.js';

async function updateUserNames() {
  try {
    // Connect directly to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Find users without firstName/lastName
    const users = await User.find({
      $or: [
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
        { firstName: null },
        { lastName: null },
        { firstName: "" },
        { lastName: "" }
      ]
    });

    console.log(`Found ${users.length} users without proper names`);

    for (const user of users) {
      const updateData = {};
      
      if (!user.firstName) {
        // Generate first name based on email or role
        if (user.email.includes('admin')) {
          updateData.firstName = 'Admin';
        } else if (user.email.includes('org')) {
          updateData.firstName = 'Organization';
        } else {
          updateData.firstName = 'User';
        }
      }
      
      if (!user.lastName) {
        updateData.lastName = 'Manager';
      }

      await User.findByIdAndUpdate(user._id, updateData);
      console.log(`Updated ${user.email}: ${updateData.firstName} ${updateData.lastName}`);
    }

    console.log('All users updated successfully');
    
    // Verify the updates
    const updatedUsers = await User.find({}).select('email firstName lastName');
    console.log('\nVerification - All users:');
    updatedUsers.forEach(user => {
      console.log(`${user.email}: ${user.firstName} ${user.lastName}`);
    });

  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateUserNames();