const express = require('express');
const { getUsers, updateUserStatus, updateUserRole, changePassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), getUsers);
router.put('/change-password', protect, changePassword);
router.put('/:id/status', protect, authorize('admin'), updateUserStatus);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);

module.exports = router;
