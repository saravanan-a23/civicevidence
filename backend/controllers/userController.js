const User = require('../models/User');
const logAudit = require('../utils/auditLogger');

/**
 * List all users (Admin only)
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;

    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user status (approve/activate/deactivate) (Admin only)
 * PUT /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be active or inactive.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent deactivating own account
    if (targetUser._id.toString() === req.user._id.toString() && status === 'inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own Admin account.' });
    }

    targetUser.status = status;
    await targetUser.save();

    await logAudit(req, {
      action: 'USER_STATUS_CHANGE',
      target: targetUser._id.toString(),
      details: `Updated user status for "${targetUser.email}" to "${status}"`,
    });

    res.json({ message: `User account set to ${status}.`, user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user role (Admin only)
 * PUT /api/users/:id/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'officer', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent changing own admin role
    if (targetUser._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot demote yourself from Admin role.' });
    }

    targetUser.role = role;
    await targetUser.save();

    await logAudit(req, {
      action: 'USER_ROLE_CHANGE',
      target: targetUser._id.toString(),
      details: `Updated user role for "${targetUser.email}" to "${role}"`,
    });

    res.json({ message: `User role updated to ${role}.`, user: targetUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Change own password (authenticated user)
 * PUT /api/users/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Validate new password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Security Alert: Password does not meet complexity requirements.' 
      });
    }

    // Save new password (pre-save middleware handles hashing)
    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: 'PASSWORD_CHANGE',
      target: user._id.toString(),
      details: 'User successfully updated their account password.',
      userId: user._id
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  changePassword,
};
