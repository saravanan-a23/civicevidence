const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear all collections
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
      console.log(`✔ Cleared collection: "${collectionName}"`);
    }
    
    console.log('✔ Database successfully cleared. Restarting registration sequence...');
  } catch (err) {
    console.error('Clear database error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

clearDB();
