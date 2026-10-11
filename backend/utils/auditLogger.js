const AuditLog = require('../models/AuditLog');
const useragent = require('useragent');

/**
 * Log an action to the immutable audit database
 */
const logAudit = async (req, { action, target, details, status = 'success', userId = null }) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const uaString = req.headers['user-agent'] || 'Unknown Device';
    const agent = useragent.parse(uaString);
    const deviceString = `${agent.os.toString()} - ${agent.toAgent()}`;

    const finalUserId = userId || (req.user ? req.user._id : null);

    await AuditLog.create({
      user: finalUserId,
      action,
      target,
      ipAddress: ip,
      device: deviceString,
      status,
      details,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error.message);
  }
};

module.exports = logAudit;
