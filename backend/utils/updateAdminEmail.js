const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const updateAdminEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to database.');

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId('6a62fe0d9ad13c1fb223fb1c') },
      { email: 'civicevidence@gmail.com' }
    );
    
    console.log(`✔ Successfully updated Admin email to "civicevidence@gmail.com". (Modified: ${result.modifiedCount} document)`);
  } catch (err) {
    console.error('Email update failed:', err);
  } finally {
    await mongoose.disconnect();
  }
};

updateAdminEmail();
