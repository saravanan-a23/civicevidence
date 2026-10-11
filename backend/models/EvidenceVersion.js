const mongoose = require('mongoose');

const evidenceVersionSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evidence',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changes: {
      type: String,
      required: true,
      default: 'Evidence updated',
    },
    encryptedFileURL: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true, // Integrity hash of this version
    },
    fileKeyEncrypted: {
      type: String,
      required: true,
    },
    fileIvHex: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('EvidenceVersion', evidenceVersionSchema);
