import os

with open('build_full_pages_report.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = None
end_idx = None

for i, l in enumerate(lines):
    if 'APPENDIX A: SELECTED CODE / TECHNICAL ARTIFACTS' in l:
        start_idx = i - 1 # include the comment header divider
    if 'APPENDIX B: INTERNSHIP CERTIFICATE' in l:
        end_idx = i - 1 # line right before Appendix B comment header divider
        break

print(f"Replacing lines {start_idx+1} to {end_idx+1} (0-indexed: {start_idx} to {end_idx})")

new_appendix_a = """    # =========================================================================
    # APPENDIX A: SELECTED CODE / TECHNICAL ARTIFACTS (EXACTLY 3 FULL PAGES AT 12PT)
    # =========================================================================
    print("Building Appendix A: Clean Monospaced Code across Exactly 3 Full Pages at 12pt...")
    doc.add_page_break()
    add_p("APPENDIX A \u2013 EVIDENCE_CONTROLLER.JS", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=2, bold=True, font_size=13)
    add_p(
        "This controller module implements core digital evidence management operations including evidence listing with search and pagination, "
        "file upload with AES-256-GCM envelope encryption, secure file download with SHA-256 integrity verification, versioning, soft delete, and rollback. "
        "Every state change and data access is automatically tracked by the ISO 27037 audit logger.",
        space_after=2, font_size=10.5, line_spacing=1.1
    )

    def add_code_line(text, font_size=12):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        leading_spaces = len(text) - len(text.lstrip(' '))
        content = text.strip()
        if content:
            r = p.add_run(" " * leading_spaces + content)
            r.font.name = 'Consolas'
            r.font.size = Pt(font_size)
            r.font.color.rgb = COLOR_CODE_DARK
        else:
            r = p.add_run(" ")
            r.font.name = 'Consolas'
            r.font.size = Pt(font_size / 2)
        return p

    # Page 1 of Appendix A (Body Page 20)
    p1_lines = [
        "const Evidence = require('../models/Evidence');",
        "const Case = require('../models/Case');",
        "const Permission = require('../models/Permission');",
        "const EvidenceVersion = require('../models/EvidenceVersion');",
        "const encryptionService = require('../services/encryptionService');",
        "const storageService = require('../services/storageService');",
        "const logAudit = require('../utils/auditLogger');",
        "const mongoose = require('mongoose');",
        "",
        "const checkUserAccess = async (user, evidenceId, requiredPermission = 'read') => {",
        "  if (user.role === 'admin' || user.role === 'officer') return true;",
        "  const evidence = await Evidence.findById(evidenceId);",
        "  if (!evidence) return false;",
        "  if (evidence.uploadedBy.toString() === user._id.toString()) return true;",
        "  const activePermission = await Permission.findOne({",
        "    evidenceId, sharedWith: user._id, expiresAt: { $gt: new Date() }",
        "  });",
        "  if (!activePermission) return false;",
        "  if (requiredPermission === 'download') {",
        "    return activePermission.permission === 'download' ||",
        "           activePermission.permission === 'edit_metadata';",
        "  }",
        "  return true;",
        "};",
        "",
        "const getEvidenceById = async (req, res) => {",
        "  try {",
        "    const evidence = await Evidence.findById(req.params.id)",
        "      .populate('uploadedBy', 'name email role')",
        "      .populate('caseId', 'caseNumber title status assignedOfficer');",
        "    if (!evidence || (evidence.isDeleted && req.user.role !== 'admin')) {",
        "      return res.status(404).json({ message: 'Evidence not found.' });",
        "    }",
    ]
    for line in p1_lines:
        add_code_line(line, font_size=12)

    doc.add_page_break()

    # Page 2 of Appendix A (Body Page 21)
    p2_lines = [
        "    const hasAccess = await checkUserAccess(req.user, evidence._id, 'read');",
        "    if (!hasAccess) return res.status(403).json({ message: 'Access denied.' });",
        "    const versions = await EvidenceVersion.find({ evidenceId: evidence._id })",
        "      .populate('updatedBy', 'name email role').sort({ version: -1 });",
        "    await logAudit(req, { action: 'VIEW', target: evidence._id.toString(), details: `Viewed: ${evidence.title}` });",
        "    res.json({ evidence, versions });",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const uploadEvidence = async (req, res) => {",
        "  try {",
        "    if (!req.file) return res.status(400).json({ message: 'Please upload a file.' });",
        "    const { title, description, caseId, tags, category } = req.body;",
        "    if (!title) return res.status(400).json({ message: 'Evidence title is required.' });",
        "    if (caseId) {",
        "      const parentCase = await Case.findById(caseId);",
        "      if (!parentCase) return res.status(404).json({ message: 'Assigned case not found.' });",
        "    }",
        "    const fileBuffer = req.file.buffer;",
        "    const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptionService.encryptFile(fileBuffer);",
        "    const encryptedFileURL = await storageService.uploadFile(encryptedBuffer, req.file.originalname);",
        "    const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [];",
        "    const evidence = await Evidence.create({",
        "      title, description, caseId: caseId || undefined, uploadedBy: req.user._id,",
        "      encryptedFileURL, originalFilename: req.file.originalname, fileType: req.file.mimetype,",
        "      fileSize: req.file.size, hash, tags: parsedTags, category: category || 'General', fileKeyEncrypted, fileIvHex,",
        "    });",
        "    await logAudit(req, { action: 'UPLOAD', target: evidence._id.toString(), details: `Uploaded: ${title}` });",
        "    res.status(201).json(evidence);",
    ]
    for line in p2_lines:
        add_code_line(line, font_size=12)

    doc.add_page_break()

    # Page 3 of Appendix A (Body Page 22)
    p3_lines = [
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const downloadEvidence = async (req, res) => {",
        "  try {",
        "    const evidence = await Evidence.findById(req.params.id);",
        "    if (!evidence || evidence.isDeleted) return res.status(404).json({ message: 'Evidence not found.' });",
        "    const hasAccess = await checkUserAccess(req.user, evidence._id, 'download');",
        "    if (!hasAccess) return res.status(403).json({ message: 'Access denied: No download permission.' });",
        "    const encryptedBuffer = await storageService.downloadFile(evidence.encryptedFileURL);",
        "    const decryptedBuffer = encryptionService.decryptFile(encryptedBuffer, evidence.fileKeyEncrypted, evidence.fileIvHex);",
        "    const decryptedHash = encryptionService.calculateHash(decryptedBuffer);",
        "    if (decryptedHash !== evidence.hash) {",
        "      await logAudit(req, { action: 'INTEGRITY_FAIL', target: evidence._id.toString() });",
        "      return res.status(500).json({ message: 'Integrity compromised: Hash mismatch.' });",
        "    }",
        "    await logAudit(req, { action: 'DOWNLOAD', target: evidence._id.toString() });",
        "    res.setHeader('Content-Disposition', `attachment; filename=\\\"${evidence.originalFilename}\\\"`);",
        "    res.setHeader('Content-Type', evidence.fileType);",
        "    res.send(decryptedBuffer);",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "module.exports = { checkUserAccess, getEvidenceList, getEvidenceById, uploadEvidence, downloadEvidence };",
    ]
    for line in p3_lines:
        add_code_line(line, font_size=12)

    add_p("Deployment URL: http://localhost:5002 (Backend API) | http://localhost:5174 (Web Dashboard)", bold=True, space_before=4, space_after=2, font_size=10.5)
    add_p(
        "This controller forms the operational foundation of the CivicEvidence DEMS platform. By decoupling cryptographic operations into specialized "
        "services and enforcing immutable audit logging on every request context, it ensures strict compliance with ISO/IEC 27037 and NIST SP 800-86 standards.",
        font_size=10.5, space_after=0, line_spacing=1.12
    )

"""

lines[start_idx:end_idx] = [new_appendix_a]

with open('build_full_pages_report.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Updated build_full_pages_report.py successfully!")
