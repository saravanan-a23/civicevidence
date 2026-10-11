const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).select('name email role status isEmailVerified');
    console.log('\n======================================================');
    console.log('📋 REGISTERED USER ACCOUNTS IN MONGODB:');
    users.forEach((u, i) => {
      console.log(`${i + 1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | Status: "${u.status}"`);
    });
    console.log('======================================================\n');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

checkUsers();
