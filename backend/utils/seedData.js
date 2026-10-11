const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const Permission = require('../models/Permission');
const { encryptFile } = require('../services/encryptionService');
const { uploadFile } = require('../services/storageService');

dotenv.config();

// Fallback base64 constants in case network fetching fails
const FALLBACK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const FALLBACK_WAV = Buffer.from('UklGRigAAABXQVZFZm10IBIAAAABAAARKwAARKwAAAEAAgAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64');
// Minimal valid 1-second blank MP4 container
const FALLBACK_MP4 = Buffer.from(
  'AAAADGZ0eXBpc29tAAAAAGlzb21tcDQyAAAAOG1vb3YAAABsbXZoZAAAAADRs/zI0bP8yAABhqAAABgQAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGGlvbmQAAABUY29va2llc2hvdHRlcgA=',
  'base64'
);

const fetchBuffer = async (url, fallback) => {
  try {
    console.log(`Downloading: ${url}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn(`⚠️ Fetch failed for ${url} (${err.message}). Using local valid fallback data.`);
    return fallback;
  }
};

const runSeeder = async () => {
  console.log('\n===============================================================');
  console.log('       🛠️   CIVICEVIDENCE BULK DB CASE GENERATION RUNNER  🛠️');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ MongoDB Connected.');

    // 1. Wipe database collections for a fresh demo registry
    await User.deleteMany({});
    await Case.deleteMany({});
    await Evidence.deleteMany({});
    await AuditLog.deleteMany({});
    await Permission.deleteMany({});
    console.log('✔ Database registry successfully wiped.');

    // 2. Create the bootstrap System Admin account
    const adminPassword = 'AdminPassword123!';
    const adminUser = await User.create({
      name: 'Director Saravanan',
      email: 'admin@civicevidence.gov',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      isEmailVerified: true
    });
    console.log(`✔ Created System Administrator: "admin@civicevidence.gov" (Password: "${adminPassword}")`);

    // 3. Download the actual playable media files
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Big Buck Bunny clip (VLC Playable!)
    const audioUrl = 'https://www.w3schools.com/html/horse.mp3';   // Horse neigh sound (VLC Playable!)
    const imageUrl = 'https://www.w3schools.com/html/img_chania.jpg'; // Chania JPEG photo (Viewer Playable!)

    const videoBuffer = await fetchBuffer(videoUrl, FALLBACK_MP4);
    const audioBuffer = await fetchBuffer(audioUrl, FALLBACK_WAV);
    const imageBuffer = await fetchBuffer(imageUrl, FALLBACK_PNG);

    console.log('\n✔ All media buffers prepared successfully.');

    // 4. Case configurations list
    const caseTemplates = [
      { num: 'CASE-2026-1001', title: 'Midtown Diamond Vault Theft', desc: 'Investigation into structural vault breaching at Diamond district.' },
      { num: 'CASE-2026-1002', title: 'Cyber Extortion & Ransomware Attack', desc: 'Analysis of corporate ransomware locks and digital threat signatures.' },
      { num: 'CASE-2026-1003', title: 'Harbor Shipping Container Smuggling', desc: 'Interception of contraband shipping units entering gate 4.' },
      { num: 'CASE-2026-1004', title: 'Metropolitan Bank Burglary', desc: 'Drill tunnel penetration into safety deposit rooms during night shift.' },
      { num: 'CASE-2026-1005', title: 'Transit Sabotage & Wiretapping', desc: 'Analysis of malicious copper wire splicing on regional tracks.' },
      { num: 'CASE-2026-1006', title: 'National Art Gallery Forgery Hunt', desc: 'Verifying authenticity logs of stolen 19th-century portraits.' },
      { num: 'CASE-2026-1007', title: 'Corporate Espionage Leak Case', desc: 'Tracking internal database queries leaking financial roadmaps.' },
      { num: 'CASE-2026-1008', title: 'VIP Transport Route Ambush', desc: 'Ballistic evidence matching of gunshots fired at state transport.' },
      { num: 'CASE-2026-1009', title: 'Darknet Cryptocurrency Mixer Probe', desc: 'Tracing coin laundering pathways from exploit wallet addresses.' },
      { num: 'CASE-2026-1010', title: 'Port Gold Bullion Hijacking heist', desc: 'Armed hijacking of armored logistics vans leaving terminal.' }
    ];

    // Helper to encrypt and save a file
    const processAndIndexEvidence = async (fileBuffer, title, filename, category, mimeType, caseId, userId) => {
      // a. Encrypt payload
      const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptFile(fileBuffer);
      
      // b. Save encrypted payload via Storage Service
      const encryptedFileURL = await uploadFile(encryptedBuffer, filename);
      
      // c. Insert Evidence metadata
      const evidence = await Evidence.create({
        title,
        description: `Linked evidence for case registry files. Hash matching verified.`,
        category,
        originalFilename: filename,
        fileSize: fileBuffer.length,
        fileType: mimeType,
        encryptedFileURL,
        fileKeyEncrypted,
        fileIvHex,
        hash,
        caseId,
        uploadedBy: userId
      });

      return evidence;
    };

    console.log('\nSTEP 5: Generating 10 Cases and encrypting respective evidence items...');
    for (const temp of caseTemplates) {
      // i. Create Case Directory
      const newCase = await Case.create({
        caseNumber: temp.num,
        title: temp.title,
        description: temp.desc,
        assignedOfficer: adminUser._id,
        status: 'open'
      });

      // ii. Create case-specific file names to avoid collisions on storage
      const suffix = temp.num.split('-')[2];
      const videoFilename = `cctv_footage_${suffix}.mp4`;
      const audioFilename = `interrogation_audio_${suffix}.mp3`;
      const imageFilename = `crime_scene_photo_${suffix}.jpg`;

      // iii. Process Video
      const videoEvidence = await processAndIndexEvidence(
        videoBuffer,
        `Surveillance CCTV Video [${temp.num}]`,
        videoFilename,
        'Video',
        'video/mp4',
        newCase._id,
        adminUser._id
      );

      // iv. Process Audio
      const audioEvidence = await processAndIndexEvidence(
        audioBuffer,
        `Interrogation Recording [${temp.num}]`,
        audioFilename,
        'Audio',
        'audio/mp3',
        newCase._id,
        adminUser._id
      );

      // v. Process Image
      const imageEvidence = await processAndIndexEvidence(
        imageBuffer,
        `Scene Capture Image [${temp.num}]`,
        imageFilename,
        'Image',
        'image/jpeg',
        newCase._id,
        adminUser._id
      );

      // vi. Link evidence objects to Case document
      newCase.evidence = [videoEvidence._id, audioEvidence._id, imageEvidence._id];
      await newCase.save();

      // vii. Record Audit Trail entries
      await AuditLog.create({
        action: 'CASE_CREATE',
        target: newCase._id.toString(),
        details: `Auto-seeded case directory ${temp.num} during initial setup.`,
        user: adminUser._id,
        ipAddress: '127.0.0.1',
        device: 'System Seeder / Node.js',
        status: 'success'
      });

      console.log(`✔ Case ${temp.num} generated with 3 encrypted files (1 Video, 1 Audio, 1 Image)`);
    }

    console.log('\n===============================================================');
    console.log('      🏁   DATABASE SEEDING COMPLETED SUCCESSFULLY!   🏁');
    console.log('===============================================================\n');

  } catch (error) {
    console.error('❌ Seeder crashed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runSeeder();
