const express = require('express');
const router = express.Router();
const { chatWithAi, getQuickStats } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAi);
router.get('/quick-stats', protect, getQuickStats);

module.exports = router;
