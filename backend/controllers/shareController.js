const Permission = require('../models/Permission');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const logAudit = require('../utils/auditLogger');

/**
 * Share Evidence
 * POST /api/share
 */
const shareEvidence = async (req, res) => {
  try {
    const { evidenceId, email, permission, expiresAt } = req.body;

    if (!evidenceId || !email || !permission || !expiresAt) {
      return res.status(400).json({ message: 'Evidence ID, User Email, Permission level, and Expiration Date are required.' });
    }

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence || evidence.isDeleted) {
      return res.status(404).json({ message: 'Evidence file not found.' });
    }

    // Access control: only owner, officer, or admin can share
    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();
    const canShare = isOwner || req.user.role === 'admin' || req.user.role === 'officer';

    if (!canShare) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to share this evidence.' });
    }

    // Find user to share with
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: `No user found with email address: "${email}"` });
    }

    if (targetUser._id.toString() === evidence.uploadedBy.toString()) {
      return res.status(400).json({ message: 'Cannot share evidence with its owner.' });
    }

    // Check if permission already exists
    let existingPermission = await Permission.findOne({
      evidenceId,
      sharedWith: targetUser._id,
    });

    if (existingPermission) {
      // Update existing permission
      existingPermission.permission = permission;
      existingPermission.expiresAt = new Date(expiresAt);
      existingPermission.sharedBy = req.user._id;
      await existingPermission.save();

      await logAudit(req, {
        action: 'PERMISSION_UPDATE',
        target: evidence._id.toString(),
        details: `Updated sharing permission for user "${email}" to level "${permission}". Expiry: ${expiresAt}`,
      });

      return res.json({ message: 'Sharing permissions updated successfully.', permission: existingPermission });
    }

    // Create new permission
    const newPermission = await Permission.create({
      evidenceId,
      sharedWith: targetUser._id,
      permission,
      expiresAt: new Date(expiresAt),
      sharedBy: req.user._id,
    });

    await logAudit(req, {
      action: 'SHARE',
      target: evidence._id.toString(),
      details: `Shared evidence "${evidence.title}" with user "${email}" at level "${permission}". Expiry: ${expiresAt}`,
    });

    res.status(201).json({ message: 'Evidence shared successfully.', permission: newPermission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get active shared permissions for a user or evidence file
 * GET /api/share
 */
const getShares = async (req, res) => {
  try {
    const { evidenceId } = req.query;

    const query = {};
    if (evidenceId) {
      query.evidenceId = evidenceId;
    }

    // If standard user, only show permissions shared by or with them
    if (req.user.role === 'user') {
      query.$or = [
        { sharedWith: req.user._id },
        { sharedBy: req.user._id },
      ];
    }

    const permissions = await Permission.find(query)
      .populate('evidenceId', 'title originalFilename fileType')
      .populate('sharedWith', 'name email role')
      .populate('sharedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Revoke sharing permission
 * DELETE /api/share/:id
 */
const revokeShare = async (req, res) => {
  try {
    const permission = await Permission.findById(req.id || req.params.id).populate('evidenceId');
    if (!permission) {
      return res.status(404).json({ message: 'Permission record not found.' });
    }

    const evidence = permission.evidenceId;
    if (!evidence) {
      // Just delete permission if evidence already gone
      await Permission.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Access revoked.' });
    }

    // Access control: only owner, officer, admin, or the shared user themselves can revoke
    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();
    const isSharedWithUser = permission.sharedWith.toString() === req.user._id.toString();
    const canRevoke = isOwner || isSharedWithUser || req.user.role === 'admin' || req.user.role === 'officer';

    if (!canRevoke) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to revoke this sharing permission.' });
    }

    const targetUser = await User.findById(permission.sharedWith);
    const targetEmail = targetUser ? targetUser.email : 'Unknown';

    await Permission.findByIdAndDelete(req.params.id);

    await logAudit(req, {
      action: 'SHARE_REVOKE',
      target: evidence._id.toString(),
      details: `Revoked access to "${evidence.title}" for user "${targetEmail}"`,
    });

    res.json({ message: 'Access revoked successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  shareEvidence,
  getShares,
  revokeShare,
};
