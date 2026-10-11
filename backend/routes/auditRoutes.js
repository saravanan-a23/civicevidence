const express = require('express');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin', 'officer'), getAuditLogs);
router.get('/:id', protect, authorize('admin', 'officer'), getAuditLogById);

module.exports = router;
