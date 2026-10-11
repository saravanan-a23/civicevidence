const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Retrieve Audit Logs (Officer/Admin only)
 * GET /api/audit
 */
const getAuditLogs = async (req, res) => {
  try {
    const { search, action, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Filter by search (user name/email or target)
    if (search) {
      // Find matching users first
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      const userIds = users.map((u) => u._id);

      query.$or = [
        { user: { $in: userIds } },
        { target: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      logs,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get individual log entry details
 * GET /api/audit/:id
 */
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('user', 'name email role');
    if (!log) {
      return res.status(404).json({ message: 'Audit log entry not found.' });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
