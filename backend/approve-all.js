const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const approveAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.updateMany({}, { status: 'active', isEmailVerified: true });
    console.log(`✔ Successfully approved and activated ${result.modifiedCount} accounts in the database.`);
  } catch (err) {
    console.error('Approval script error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

approveAll();
