const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const checkLogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(10);
    console.log('--- RECENT SYSTEM AUDIT LOGS ---');
    logs.forEach(l => {
      console.log({
        timestamp: l.timestamp,
        action: l.action,
        target: l.target,
        status: l.status,
        details: l.details
      });
    });
    console.log('---------------------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

checkLogs();
