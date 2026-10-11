const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an evidence title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: false, // Optional if uploaded as standalone first
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    encryptedFileURL: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true, // SHA-256 integrity hash of original file
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Encryption details for individual file
    fileKeyEncrypted: {
      type: String,
      required: true, // Hex encrypted file key
    },
    fileIvHex: {
      type: String,
      required: true, // Hex IV
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evidence', evidenceSchema);
