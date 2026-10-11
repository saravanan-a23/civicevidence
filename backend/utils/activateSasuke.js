const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const activateAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.updateOne(
      { email: 'sasukei7074@gmail.com' },
      { status: 'active', role: 'admin', isEmailVerified: true }
    );
    console.log(`\n✔ Account "sasukei7074@gmail.com" activated and promoted to Admin! (Modified: ${result.modifiedCount})\n`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

activateAccount();
