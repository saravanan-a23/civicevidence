const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a case title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'under_investigation'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);
