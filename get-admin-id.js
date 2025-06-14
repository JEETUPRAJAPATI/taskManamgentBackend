import mongoose from 'mongoose';

async function getAdminId() {
  try {
    const dbUrl = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(dbUrl);
    
    const adminUser = await mongoose.model('User').findOne({ email: 'admin@demo.com' });
    if (adminUser) {
      console.log(adminUser._id.toString());
    } else {
      console.log('Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getAdminId();