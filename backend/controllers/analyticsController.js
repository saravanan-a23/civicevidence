const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Get Analytics & Charts Data (Officer/Admin only)
 * GET /api/analytics
 */
const getAnalytics = async (req, res) => {
  try {
    // 1. General counts
    const totalEvidence = await Evidence.countDocuments({ isDeleted: false });
    const totalCases = await Case.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: 'active' });

    // 2. Storage calculation
    const storageStats = await Evidence.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);
    const totalStorageBytes = storageStats.length > 0 ? storageStats[0].totalSize : 0;

    // 3. Evidence Categories Aggregation
    const categoryStats = await Evidence.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$fileSize' } } },
      { $sort: { count: -1 } },
    ]);

    // 4. Case Status Aggregation
    const caseStats = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 5. Monthly Upload Timeline (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const monthlyStats = await Evidence.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          size: { $sum: '$fileSize' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly data for front-end charts (e.g. "Jan", "Feb")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyStats.map((item) => {
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        uploads: item.count,
        sizeMb: Number((item.size / (1024 * 1024)).toFixed(2)),
      };
    });

    // 6. Officer Activity ranking (uploads count)
    const officerStats = await Evidence.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officer',
        },
      },
      { $unwind: '$officer' },
      {
        $project: {
          name: '$officer.name',
          email: '$officer.email',
          count: 1,
        },
      },
    ]);

    // 7. Recent System Activity logs
    const recentActivities = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      summary: {
        totalEvidence,
        totalCases,
        totalUsers,
        activeUsers,
        totalStorageBytes,
        totalStorageMb: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
      },
      categories: categoryStats.map((c) => ({
        category: c._id || 'General',
        count: c.count,
        sizeMb: Number((c.size / (1024 * 1024)).toFixed(2)),
      })),
      cases: caseStats.map((cs) => ({
        status: cs._id,
        count: cs.count,
      })),
      monthlyUploads: formattedMonthly,
      officerActivity: officerStats,
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
};
