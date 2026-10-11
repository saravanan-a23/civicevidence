const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');

dotenv.config();

const restoreUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to database.');

    // Remove the temporary admin created by the seeder
    await User.deleteMany({ email: 'admin@civicevidence.gov' });
    await User.deleteMany({ email: 'mike@gmail.com' });

    const defaultPassword = 'Password123!';

    // 1. Re-create 'saravanan' with original ObjectId
    const saravanan = await User.create({
      _id: new mongoose.Types.ObjectId('6a62fe0d9ad13c1fb223fb1c'),
      name: 'saravanan',
      email: 'admin@civicevidence.gov',
      password: defaultPassword,
      role: 'admin',
      status: 'active',
      isEmailVerified: true
    });
    console.log('✔ Restored account: "saravanan" (admin@civicevidence.gov)');

    // 2. Re-create 'mike' with original ObjectId
    const mike = await User.create({
      _id: new mongoose.Types.ObjectId('6a6308fa9ad13c1fb223fbed'),
      name: 'mike',
      email: 'mike@gmail.com',
      password: defaultPassword,
      role: 'user',
      status: 'active',
      isEmailVerified: true
    });
    console.log('✔ Restored account: "mike" (mike@gmail.com)');

    // 3. Update the ownership of all Case directories to 'saravanan'
    const caseResult = await Case.updateMany({}, {
      assignedOfficer: saravanan._id
    });
    console.log(`✔ Linked ${caseResult.modifiedCount} cases to saravanan's account.`);

    // 4. Update the ownership of all Evidence files to 'saravanan'
    const evidenceResult = await Evidence.updateMany({}, {
      uploadedBy: saravanan._id
    });
    console.log(`✔ Linked ${evidenceResult.modifiedCount} evidence files to saravanan's account.`);

    console.log('\n🏁 User restoration and case linking completed successfully!');

  } catch (err) {
    console.error('Error during restoration:', err);
  } finally {
    await mongoose.disconnect();
  }
};

restoreUsers();
