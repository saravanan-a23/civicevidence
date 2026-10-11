const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const logAudit = require('../utils/auditLogger');

/**
 * Create Case (Officer/Admin only)
 * POST /api/cases
 */
const createCase = async (req, res) => {
  try {
    const { title, description, assignedOfficer, caseNumber } = req.body;

    if (!title || !caseNumber || !assignedOfficer) {
      return res.status(400).json({ message: 'Title, Case Number, and Assigned Officer are required.' });
    }

    // Check unique case number
    const caseExists = await Case.findOne({ caseNumber });
    if (caseExists) {
      return res.status(400).json({ message: 'Case number already exists.' });
    }

    const newCase = await Case.create({
      caseNumber,
      title,
      description,
      assignedOfficer,
    });

    await logAudit(req, {
      action: 'CASE_CREATE',
      target: newCase._id.toString(),
      details: `Created case ${caseNumber}: "${title}"`,
    });

    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Case List
 * GET /api/cases
 */
const getCases = async (req, res) => {
  try {
    const { search, status, sort } = req.query;

    const query = {};

    // Filter by search term
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Role-based visibility
    if (req.user.role === 'user') {
      // Users can only see cases where they uploaded evidence
      const userEvidence = await Evidence.find({ uploadedBy: req.user._id }).select('caseId');
      const userCaseIds = userEvidence.map((e) => e.caseId).filter(Boolean);
      query._id = { $in: userCaseIds };
    }

    // Sort order
    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sort === 'number') {
      sortObj = { caseNumber: 1 };
    }

    const cases = await Case.find(query)
      .populate('assignedOfficer', 'name email role')
      .sort(sortObj);

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Case by ID (with details and associated evidence)
 * GET /api/cases/:id
 */
const getCaseById = async (req, res) => {
  try {
    const parentCase = await Case.findById(req.params.id).populate('assignedOfficer', 'name email role');
    if (!parentCase) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    // Access control
    if (req.user.role === 'user') {
      const userEvidenceCount = await Evidence.countDocuments({
        caseId: parentCase._id,
        uploadedBy: req.user._id,
      });
      if (userEvidenceCount === 0) {
        return res.status(403).json({ message: 'Access denied: You are not authorized to view this case.' });
      }
    }

    // Fetch related evidence (exclude deleted items)
    const evidenceList = await Evidence.find({ caseId: parentCase._id, isDeleted: false }).populate(
      'uploadedBy',
      'name email role'
    );

    await logAudit(req, {
      action: 'CASE_VIEW',
      target: parentCase._id.toString(),
      details: `Viewed details of case: "${parentCase.caseNumber}"`,
    });

    res.json({ case: parentCase, evidence: evidenceList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Case (Officer/Admin only)
 * PUT /api/cases/:id
 */
const updateCase = async (req, res) => {
  try {
    const parentCase = await Case.findById(req.params.id);
    if (!parentCase) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const { title, description, assignedOfficer, status } = req.body;

    if (title) parentCase.title = title;
    if (description !== undefined) parentCase.description = description;
    if (assignedOfficer) parentCase.assignedOfficer = assignedOfficer;
    if (status) parentCase.status = status;

    await parentCase.save();

    await logAudit(req, {
      action: 'CASE_UPDATE',
      target: parentCase._id.toString(),
      details: `Updated case ${parentCase.caseNumber}. Status: ${parentCase.status}`,
    });

    res.json(parentCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Case (Officer/Admin only)
 * DELETE /api/cases/:id
 */
const deleteCase = async (req, res) => {
  try {
    const parentCase = await Case.findById(req.params.id);
    if (!parentCase) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    // Delete case in DB
    await Case.findByIdAndDelete(req.params.id);

    // Unassign case from associated evidence (do not delete evidence files)
    await Evidence.updateMany({ caseId: req.params.id }, { $unset: { caseId: '' } });

    await logAudit(req, {
      action: 'CASE_DELETE',
      target: req.params.id,
      details: `Deleted case ${parentCase.caseNumber}: "${parentCase.title}"`,
    });

    res.json({ message: 'Case deleted successfully. Evidence unassigned.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
};
