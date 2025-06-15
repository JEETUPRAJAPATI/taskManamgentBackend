import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: String,
  status: String,
  organizationId: String,
  passwordHash: String
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function updateUsers() {
  try {
    const mongoUri = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const updateData = {};
      
      if (!user.firstName || user.firstName.trim() === '') {
        if (user.email.includes('admin')) {
          updateData.firstName = 'Admin';
        } else if (user.email.includes('org')) {
          updateData.firstName = 'John';
        } else {
          updateData.firstName = 'User';
        }
      }
      
      if (!user.lastName || user.lastName.trim() === '') {
        if (user.email.includes('admin')) {
          updateData.lastName = 'User';
        } else {
          updateData.lastName = 'Manager';
        }
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(user._id, updateData);
        console.log(`Updated ${user.email}: ${updateData.firstName || user.firstName} ${updateData.lastName || user.lastName}`);
      }
    }

    // Verify updates
    const updatedUsers = await User.find({}).select('email firstName lastName');
    console.log('\nFinal user data:');
    updatedUsers.forEach(user => {
      console.log(`${user.email}: "${user.firstName}" "${user.lastName}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateUsers();