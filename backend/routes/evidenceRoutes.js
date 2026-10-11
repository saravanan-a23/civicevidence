const express = require('express');
const multer = require('multer');
const {
  getEvidenceList,
  getEvidenceById,
  uploadEvidence,
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  restoreEvidence,
  rollbackEvidenceVersion,
} = require('../controllers/evidenceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Multiparts parser in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router
  .route('/')
  .get(protect, getEvidenceList)
  .post(protect, upload.single('file'), uploadEvidence);

router
  .route('/:id')
  .get(protect, getEvidenceById)
  .put(protect, upload.single('file'), updateEvidence)
  .delete(protect, deleteEvidence);

router.get('/:id/download', protect, downloadEvidence);
router.post('/:id/restore', protect, authorize('admin'), restoreEvidence);
router.post('/:id/rollback', protect, authorize('admin', 'officer'), rollbackEvidenceVersion);

module.exports = router;
