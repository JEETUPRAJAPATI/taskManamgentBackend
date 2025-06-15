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

async function quickFix() {
  try {
    // Use the same connection string format as the main app
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL not found');
      return;
    }
    
    await mongoose.connect(dbUrl);
    console.log('Connected to database');

    // Update all users with missing firstName/lastName
    const result = await User.updateMany(
      {
        $or: [
          { firstName: { $exists: false } },
          { lastName: { $exists: false } },
          { firstName: null },
          { lastName: null },
          { firstName: "" },
          { lastName: "" }
        ]
      },
      {
        $set: {
          firstName: "John",
          lastName: "Doe"
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);

    // Verify the changes
    const users = await User.find({}).select('email firstName lastName');
    console.log('\nUsers after update:');
    users.forEach(user => {
      console.log(`${user.email}: ${user.firstName} ${user.lastName}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

quickFix();