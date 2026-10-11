const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log('--- USER REGISTRY STATE IN DATABASE ---');
    users.forEach(u => {
      console.log({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        isEmailVerified: u.isEmailVerified,
        otp: u.otp
      });
    });
    console.log('---------------------------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

checkDB();
