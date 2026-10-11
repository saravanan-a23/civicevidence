const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const encryptionService = require('./services/encryptionService');
const storageService = require('./services/storageService');
const User = require('./models/User');

// Load env
dotenv.config();

const runTest = async () => {
  console.log('--- STARTING CIVICEVIDENCE BACKEND TEST ---');

  try {
    // 1. Test database connection
    console.log('Connecting to database:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to MongoDB successfully.');

    // 2. Clear previous test users if any
    await User.deleteMany({ email: 'test@civicevidence.test' });

    // 3. Test User Registration
    const testUser = await User.create({
      name: 'Agent Test',
      email: 'test@civicevidence.test',
      password: 'password123',
      role: 'officer',
      status: 'active',
      isEmailVerified: true
    });
    console.log('✔ Created test User account:', testUser.email);

    // 4. Test Encryption & Decryption Stream roundtrip
    const originalText = 'CONFIDENTIAL: DIGITAL EVIDENCE FILE CONTENT. CASE ID 48123-A.';
    const buffer = Buffer.from(originalText, 'utf-8');
    
    console.log('Original Text:', originalText);
    console.log('Original Hash:', encryptionService.calculateHash(buffer));

    // Encrypt
    const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptionService.encryptFile(buffer);
    console.log('✔ Encrypted buffer successfully.');
    console.log('Encrypted Hex Preview:', encryptedBuffer.slice(0, 16).toString('hex') + '...');
    console.log('Encrypted key:', fileKeyEncrypted);
    console.log('IV Hex:', fileIvHex);

    // Store File
    const fileURL = await storageService.uploadFile(encryptedBuffer, 'confidential-case-report.txt');
    console.log('✔ File stored successfully at URL:', fileURL);

    // Retrieve File
    const downloadedBuffer = await storageService.downloadFile(fileURL);
    console.log('✔ File downloaded from storage.');

    // Decrypt
    const decryptedBuffer = encryptionService.decryptFile(downloadedBuffer, fileKeyEncrypted, fileIvHex);
    const decryptedText = decryptedBuffer.toString('utf-8');
    const decryptedHash = encryptionService.calculateHash(decryptedBuffer);

    console.log('Decrypted Text:', decryptedText);
    console.log('Decrypted Hash:', decryptedHash);

    if (decryptedText === originalText && decryptedHash === hash) {
      console.log('✔ SUCCESS: Decrypted text matches original and hash is verified!');
    } else {
      throw new Error('FAILED: Decrypted contents or hashes do not match.');
    }

    // Clean up
    await storageService.deleteFile(fileURL);
    console.log('✔ Storage file cleaned up.');
    await User.findByIdAndDelete(testUser._id);
    console.log('✔ Test user database entry cleaned up.');

    console.log('--- BACKEND TEST COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runTest();
