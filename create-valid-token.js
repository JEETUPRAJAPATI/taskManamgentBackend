import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function createValidToken() {
  try {
    // Use the same connection string as the main app
    const mongoUrl = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(mongoUrl);
    
    console.log('Connected to MongoDB');

    // Find an existing admin user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'admin@demo.com' });

    if (user) {
      console.log('Found user:', {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization?.toString()
      });

      const token = jwt.sign({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organization?.toString()
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('\nValid token:');
      console.log(token);
    } else {
      console.log('No admin user found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

createValidToken();