const express = require('express');
const { shareEvidence, getShares, revokeShare } = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .post(protect, shareEvidence)
  .get(protect, getShares);

router.delete('/:id', protect, revokeShare);

module.exports = router;
