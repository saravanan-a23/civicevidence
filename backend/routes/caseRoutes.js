const express = require('express');
const {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
} = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getCases)
  .post(protect, authorize('admin', 'officer'), createCase);

router
  .route('/:id')
  .get(protect, getCaseById)
  .put(protect, authorize('admin', 'officer'), updateCase)
  .delete(protect, authorize('admin', 'officer'), deleteCase);

module.exports = router;
