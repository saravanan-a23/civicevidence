const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Null for unauthenticated actions like login failures
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true, // Details of object modified/viewed (e.g. Evidence ID, Case ID)
    },
    ipAddress: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true, // Client user agent
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
