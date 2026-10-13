const Evidence = require('../models/Evidence');

const Case = require('../models/Case');

const Permission = require('../models/Permission');

const EvidenceVersion = require('../models/EvidenceVersion');

const encryptionService = require('../services/encryptionService');

const storageService = require('../services/storageService');

const logAudit = require('../utils/auditLogger');

const mongoose = require('mongoose');

const checkUserAccess = async (user, evidenceId, requiredPermission = 'read') => {

  if (user.role === 'admin' || user.role === 'officer') {

    return true;

  }

  const evidence = await Evidence.findById(evidenceId);

  if (!evidence) return false;

  if (evidence.uploadedBy.toString() === user._id.toString()) return true;

  const activePermission = await Permission.findOne({

    evidenceId,

    sharedWith: user._id,

    expiresAt: { $gt: new Date() },

  });

  if (!activePermission) return false;

  if (requiredPermission === 'download') {

    return activePermission.permission === 'download' || activePermission.permission === 'edit_metadata';

  }

  return true;

};

const getEvidenceList = async (req, res) => {

  try {

    const { search, caseId, category, fileType, tag, sort, page = 1, limit = 10, includeDeleted = 'false' } = req.query;

    const query = {};

    if (includeDeleted === 'true' && req.user.role === 'admin') {

      query.isDeleted = true;

    } else {

      query.isDeleted = false;

    }

    if (req.user.role === 'user') {

      const sharedPermissions = await Permission.find({

        sharedWith: req.user._id,

        expiresAt: { $gt: new Date() },

      }).select('evidenceId');

      const sharedIds = sharedPermissions.map((p) => p.evidenceId);

      query.$or = [

        { uploadedBy: req.user._id },

        { _id: { $in: sharedIds } },

      ];

    }

    if (search) {

      query.$and = query.$and || [];

      query.$and.push({

        $or: [

          { title: { $regex: search, $options: 'i' } },

          { description: { $regex: search, $options: 'i' } },

          { originalFilename: { $regex: search, $options: 'i' } },

        ],

      });

    }

    if (caseId) {

      query.caseId = caseId;

    }

    if (category) {

      query.category = category;

    }

    if (fileType) {

      query.fileType = { $regex: fileType, $options: 'i' };

    }

    if (tag) {

      query.tags = tag;

    }

    let sortObj = { createdAt: -1 };

    if (sort === 'oldest') {

      sortObj = { createdAt: 1 };

    } else if (sort === 'name') {

      sortObj = { title: 1 };

    } else if (sort === 'size') {

      sortObj = { fileSize: -1 };

    }

    const skip = (page - 1) * limit;

    const total = await Evidence.countDocuments(query);

    const evidence = await Evidence.find(query)

      .populate('uploadedBy', 'name email role')

      .populate('caseId', 'caseNumber title')

      .sort(sortObj)

      .skip(skip)

      .limit(Number(limit));

    res.json({

      evidence,

      page: Number(page),

      pages: Math.ceil(total / limit),

      total,

    });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const getEvidenceById = async (req, res) => {

  try {

    const evidence = await Evidence.findById(req.params.id)

      .populate('uploadedBy', 'name email role')

      .populate('caseId', 'caseNumber title status assignedOfficer');

    if (!evidence || (evidence.isDeleted && req.user.role !== 'admin')) {

      return res.status(404).json({ message: 'Evidence not found.' });

    }

    const hasAccess = await checkUserAccess(req.user, evidence._id, 'read');

    if (!hasAccess) {

      await logAudit(req, {

        action: 'VIEW_DENIED',

        target: evidence._id.toString(),

        details: 'Attempted to view evidence without permission',

        status: 'failure',

      });

      return res.status(403).json({ message: 'Access denied: You do not have permissions to view this evidence.' });

    }

    const versions = await EvidenceVersion.find({ evidenceId: evidence._id })

      .populate('updatedBy', 'name email role')

      .sort({ version: -1 });

    await logAudit(req, {

      action: 'VIEW',

      target: evidence._id.toString(),

      details: `Viewed metadata of: "${evidence.title}"`,

    });

    res.json({ evidence, versions });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const uploadEvidence = async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({ message: 'Please upload a file.' });

    }

    const { title, description, caseId, tags, category } = req.body;

    if (!title) {

      return res.status(400).json({ message: 'Evidence title is required.' });

    }

    if (caseId) {

      const parentCase = await Case.findById(caseId);

      if (!parentCase) {

        return res.status(404).json({ message: 'Assigned case not found.' });

      }

    }

    const fileBuffer = req.file.buffer;

    const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptionService.encryptFile(fileBuffer);

    const encryptedFileURL = await storageService.uploadFile(encryptedBuffer, req.file.originalname);

    const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [];

    const evidence = await Evidence.create({

      title,

      description,

      caseId: caseId || undefined,

      uploadedBy: req.user._id,

      encryptedFileURL,

      originalFilename: req.file.originalname,

      fileType: req.file.mimetype,

      fileSize: req.file.size,

      hash,

      tags: parsedTags,

      category: category || 'General',

      fileKeyEncrypted,

      fileIvHex,

    });

    await logAudit(req, {

      action: 'UPLOAD',

      target: evidence._id.toString(),

      details: `Uploaded evidence "${title}" (${req.file.originalname}). Hash: ${hash}`,

    });

    res.status(201).json(evidence);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const downloadEvidence = async (req, res) => {

  try {

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || evidence.isDeleted) {

      return res.status(404).json({ message: 'Evidence not found.' });

    }

    const hasAccess = await checkUserAccess(req.user, evidence._id, 'download');

    if (!hasAccess) {

      await logAudit(req, {

        action: 'DOWNLOAD_DENIED',

        target: evidence._id.toString(),

        details: 'Attempted to download evidence without permission',

        status: 'failure',

      });

      return res.status(403).json({ message: 'Access denied: You do not have permissions to download this file.' });

    }

    const encryptedBuffer = await storageService.downloadFile(evidence.encryptedFileURL);

    const decryptedBuffer = encryptionService.decryptFile(

      encryptedBuffer,

      evidence.fileKeyEncrypted,

      evidence.fileIvHex

    );

    const decryptedHash = encryptionService.calculateHash(decryptedBuffer);

    if (decryptedHash !== evidence.hash) {

      await logAudit(req, {

        action: 'INTEGRITY_FAIL',

        target: evidence._id.toString(),

        details: 'Downloaded file hash mismatch! Integrity breached.',

        status: 'failure',

      });

      return res.status(500).json({ message: 'File integrity check failed: Decrypted file hash mismatch.' });

    }

    await logAudit(req, {

      action: 'DOWNLOAD',

      target: evidence._id.toString(),

      details: `Downloaded evidence file: "${evidence.originalFilename}"`,

    });

    res.setHeader('Content-Disposition', `attachment; filename="${evidence.originalFilename}"`);

    res.setHeader('Content-Type', evidence.fileType);

    res.send(decryptedBuffer);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const updateEvidence = async (req, res) => {

  try {

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || evidence.isDeleted) {

      return res.status(404).json({ message: 'Evidence not found.' });

    }

    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();

    const canEdit = isOwner || req.user.role === 'admin' || req.user.role === 'officer';

    if (!canEdit) {

      return res.status(403).json({ message: 'Access denied: You are not authorized to update this evidence.' });

    }

    const { title, description, caseId, tags, category, changeNotes } = req.body;

    if (caseId && caseId !== (evidence.caseId ? evidence.caseId.toString() : '')) {

      const parentCase = await Case.findById(caseId);

      if (!parentCase) {

        return res.status(404).json({ message: 'Assigned case not found.' });

      }

      evidence.caseId = caseId;

    }

    if (title) evidence.title = title;

    if (description !== undefined) evidence.description = description;

    if (category) evidence.category = category;

    if (tags) {

      evidence.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());

    }

    if (req.file) {

      const currentVersionCount = await EvidenceVersion.countDocuments({ evidenceId: evidence._id });

      const nextVersionNumber = currentVersionCount + 1;

      await EvidenceVersion.create({

        evidenceId: evidence._id,

        version: nextVersionNumber,

        updatedBy: req.user._id,

        changes: changeNotes || 'New file uploaded',

        encryptedFileURL: evidence.encryptedFileURL,

        fileSize: evidence.fileSize,

        hash: evidence.hash,

        fileKeyEncrypted: evidence.fileKeyEncrypted,

        fileIvHex: evidence.fileIvHex,

      });

      const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptionService.encryptFile(req.file.buffer);

      const newFileURL = await storageService.uploadFile(encryptedBuffer, req.file.originalname);

      evidence.encryptedFileURL = newFileURL;

      evidence.originalFilename = req.file.originalname;

      evidence.fileType = req.file.mimetype;

      evidence.fileSize = req.file.size;

      evidence.hash = hash;

      evidence.fileKeyEncrypted = fileKeyEncrypted;

      evidence.fileIvHex = fileIvHex;

      await logAudit(req, {

        action: 'VERSION_UPDATE',

        target: evidence._id.toString(),

        details: `Uploaded new version (v${nextVersionNumber + 1}). Changes: ${changeNotes || 'None'}. New Hash: ${hash}`,

      });

    } else {

      await logAudit(req, {

        action: 'METADATA_UPDATE',

        target: evidence._id.toString(),

        details: `Updated metadata for "${evidence.title}"`,

      });

    }

    await evidence.save();

    res.json(evidence);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const deleteEvidence = async (req, res) => {

  try {

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || evidence.isDeleted) {

      return res.status(404).json({ message: 'Evidence not found.' });

    }

    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();

    const canDelete = isOwner || req.user.role === 'admin';

    if (!canDelete) {

      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this evidence.' });

    }

    evidence.isDeleted = true;

    await evidence.save();

    await logAudit(req, {

      action: 'DELETE',

      target: evidence._id.toString(),

      details: `Soft-deleted evidence "${evidence.title}"`,

    });

    res.json({ message: 'Evidence soft-deleted successfully.' });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const restoreEvidence = async (req, res) => {

  try {

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || !evidence.isDeleted) {

      return res.status(404).json({ message: 'Evidence not found or is not deleted.' });

    }

    evidence.isDeleted = false;

    await evidence.save();

    await logAudit(req, {

      action: 'RESTORE',

      target: evidence._id.toString(),

      details: `Restored soft-deleted evidence "${evidence.title}"`,

    });

    res.json({ message: 'Evidence restored successfully.' });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

const rollbackEvidenceVersion = async (req, res) => {

  try {

    const { versionId } = req.body;

    if (!versionId) {

      return res.status(400).json({ message: 'Version ID is required for rollback.' });

    }

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || evidence.isDeleted) {

      return res.status(404).json({ message: 'Evidence not found.' });

    }

    const targetVersion = await EvidenceVersion.findOne({

      _id: versionId,

      evidenceId: evidence._id,

    });

    if (!targetVersion) {

      return res.status(404).json({ message: 'Version record not found.' });

    }

    const currentVersionCount = await EvidenceVersion.countDocuments({ evidenceId: evidence._id });

    const nextVersionNumber = currentVersionCount + 1;

    await EvidenceVersion.create({

      evidenceId: evidence._id,

      version: nextVersionNumber,

      updatedBy: req.user._id,

      changes: `Rollback to version ${targetVersion.version}`,

      encryptedFileURL: evidence.encryptedFileURL,

      fileSize: evidence.fileSize,

      hash: evidence.hash,

      fileKeyEncrypted: evidence.fileKeyEncrypted,

      fileIvHex: evidence.fileIvHex,

    });

    evidence.encryptedFileURL = targetVersion.encryptedFileURL;

    evidence.fileSize = targetVersion.fileSize;

    evidence.hash = targetVersion.hash;

    evidence.fileKeyEncrypted = targetVersion.fileKeyEncrypted;

    evidence.fileIvHex = targetVersion.fileIvHex;

    await evidence.save();

    await logAudit(req, {

      action: 'ROLLBACK',

      target: evidence._id.toString(),

      details: `Rolled back to version ${targetVersion.version}. New version (v${nextVersionNumber + 1}) snapshot captured.`,

    });

    res.json({ message: `Successfully rolled back to version ${targetVersion.version}.`, evidence });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

module.exports = {

  getEvidenceList,

  getEvidenceById,

  uploadEvidence,

  downloadEvidence,

  updateEvidence,

  deleteEvidence,

  restoreEvidence,

  rollbackEvidenceVersion,

};