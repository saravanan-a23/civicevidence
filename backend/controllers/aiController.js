const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Handle AI Assistant Chat Query
 * @route POST /api/ai/chat
 * @access Private
 */
exports.chatWithAi = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ message: 'Please provide a valid prompt.' });
    }

    const cleanPrompt = prompt.trim().toLowerCase();

    // 1. Gather live system context from database
    const [totalEvidence, totalCases, totalAudits, totalUsers, latestEvidence, latestAudits] = await Promise.all([
      Evidence.countDocuments({ isDeleted: false }),
      Case.countDocuments({ isDeleted: false }),
      AuditLog.countDocuments(),
      User.countDocuments(),
      Evidence.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name email role'),
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(5)
        .populate('user', 'name email')
    ]);

    // Build system summary context
    const recentFileList = latestEvidence.map(e => `- 📄 **${e.title}** (${e.category || 'General'}, Hash: \`${e.hash ? e.hash.substring(0, 12) + '...' : 'N/A'}\`, By: ${e.uploadedBy ? (e.uploadedBy.name || e.uploadedBy.email) : 'System'})`).join('\n');
    const recentAuditList = latestAudits.map(a => `- 📜 **${a.action}** on \`${a.target || 'System'}\` by ${a.user ? a.user.name : 'System'} (${new Date(a.timestamp || a.createdAt).toLocaleString()})`).join('\n');

    // 2. Perform live keyword search on evidence title, category, description, tags, and original filename
    const searchKeywords = cleanPrompt
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['show', 'find', 'list', 'the', 'for', 'all', 'any', 'files', 'file', 'data', 'search', 'get', 'give', 'me', 'with', 'about', 'hey', 'hello'].includes(w));

    let searchResults = [];
    if (searchKeywords.length > 0) {
      const regexPatterns = searchKeywords.map(kw => new RegExp(kw, 'i'));
      searchResults = await Evidence.find({
        isDeleted: false,
        $or: [
          { title: { $in: regexPatterns } },
          { category: { $in: regexPatterns } },
          { description: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } },
          { originalFilename: { $in: regexPatterns } }
        ]
      }).limit(5).populate('uploadedBy', 'name email role');
    }

    const systemContext = `
You are CivicEvidence AI, an expert Digital Forensics and Evidence Management Assistant integrated into CivicEvidence DEMS.
System Live Status:
- Total Evidence Files: ${totalEvidence}
- Total Active Cases: ${totalCases}
- Audit Trail Records: ${totalAudits}
- Total Registered Users: ${totalUsers}

Recent Evidence Uploads:
${recentFileList || 'None yet'}

Recent Chain of Custody Audit Activities:
${recentAuditList || 'None yet'}
    `.trim();

    // 3. Check if Google Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemContext}\n\nUser Question: ${prompt}\nProvide a helpful, precise forensic response in markdown format.` }
                ]
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.json({
              reply,
              source: 'Gemini AI Engine',
              liveData: { totalEvidence, totalCases, totalAudits }
            });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, using built-in forensic intelligence fallback:', err.message);
      }
    }

    // 4. Built-in Forensic Intelligence Engine (Fallback / Offline Mode)
    let reply = '';

    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'help', 'who are you', 'thanks', 'thank you'];
    const isGreeting = greetings.some(g => cleanPrompt === g || cleanPrompt.startsWith(g + ' ') || cleanPrompt.endsWith(' ' + g));

    if (isGreeting) {
      reply = `### 👋 Hello! I am your CivicEvidence AI Assistant

I am here to assist your digital evidence management and forensic investigations. Here is what you can ask me:

- 📊 **System Stats**: *"How many evidence files or cases exist?"*
- 🔍 **Evidence Search**: *"Show bank robbery files"* or *"Recent evidence uploads"*
- 📜 **Audit Trail**: *"Show recent audit trail activity"*
- 🛡️ **Forensic Standards**: *"What are NIST digital evidence guidelines?"*
- 🔐 **Security Details**: *"How does SHA-256 integrity verification work?"*

How can I help you today?`;

    } else if (cleanPrompt.includes('count') || cleanPrompt.includes('how many') || cleanPrompt.includes('statistic') || cleanPrompt.includes('total')) {
      reply = `### 📊 Live System Statistics
Here is the current overview of the **CivicEvidence** repository:

- 📁 **Total Evidence Files**: \`${totalEvidence}\`
- 💼 **Active Forensic Cases**: \`${totalCases}\`
- 📜 **Audit Trail Log Entries**: \`${totalAudits}\`
- 👥 **Authorized System Users**: \`${totalUsers}\`

${latestEvidence.length > 0 ? `**Latest Uploaded Evidence:**\n${recentFileList}` : 'No evidence files have been uploaded yet.'}`;

    } else if (cleanPrompt.includes('recent') || cleanPrompt.includes('latest') || cleanPrompt.includes('uploaded')) {
      reply = `### 🔍 Recent Evidence Artifacts
Here are the most recently registered evidence items in CivicEvidence:

${latestEvidence.length > 0 ? recentFileList : 'No evidence files found in system database.'}

> **Chain of Custody Guarantee**: Every uploaded file is encrypted with **AES-256-GCM** and integrity-verified via **SHA-256 cryptographic hashes**.`;

    } else if (cleanPrompt.includes('audit') || cleanPrompt.includes('activity') || cleanPrompt.includes('who') || cleanPrompt.includes('log')) {
      reply = `### 📜 Chain of Custody & Audit Trail Highlights
Recent logged security and access actions:

${latestAudits.length > 0 ? recentAuditList : 'No recent audit actions logged.'}

All audit records are immutable and tamper-evident according to **ISO 27037 digital evidence handling standards**.`;

    } else if (cleanPrompt.includes('nist') || cleanPrompt.includes('guidelines') || cleanPrompt.includes('standard') || cleanPrompt.includes('iso')) {
      reply = `### 🛡️ NIST & ISO 27037 Digital Forensics Guidelines

CivicEvidence strictly enforces international digital evidence handling standards:

1. **Identification & Collection**: Evidence must be captured with precise timestamps and original metadata preserved.
2. **Chain of Custody**: Every access, view, download, or share event is logged with user ID, IP address, and exact timestamp.
3. **Integrity Preservation**: SHA-256 hashing is calculated upon ingestion. Any bit alteration invalidates the cryptographic proof.
4. **Confidentiality & Storage**: Files are encrypted at rest using **AES-256 envelope encryption**.`;

    } else if (cleanPrompt.includes('hash') || cleanPrompt.includes('sha') || cleanPrompt.includes('integrity') || cleanPrompt.includes('tamper')) {
      reply = `### 🔐 SHA-256 Integrity & Tamper Detection

In CivicEvidence:
- When a file is uploaded, a **SHA-256 cryptographic checksum** is generated before encryption.
- Any time evidence is retrieved or verified, the system recalculates the SHA-256 hash.
- If even a single byte of the file is modified, the computed hash will not match the stored hash, triggering an **Integrity Mismatch Alert**.`;

    } else if (cleanPrompt.includes('encryption') || cleanPrompt.includes('aes') || cleanPrompt.includes('security')) {
      reply = `### 🔒 Encryption & Security Architecture

CivicEvidence employs **Envelope Encryption Architecture**:
- **Data Encryption Key (DEK)**: Each file is encrypted with a unique AES-256 key.
- **Master Key**: The DEK is encrypted using a Master Encryption Key before saving to the database.
- **Access Control**: Only users with explicit RBAC permissions (Admin, Officer, Investigator) can decrypt and access evidence files.`;

    } else if (searchResults.length > 0) {
      // Dynamic Search Results found matching keywords!
      const resultsText = searchResults.map(e => 
        `- 📄 **${e.title}** (${e.category || 'General'})\n  - **Filename**: \`${e.originalFilename}\`\n  - **SHA-256 Hash**: \`${e.hash ? e.hash.substring(0, 16) + '...' : 'N/A'}\`\n  - **Uploaded By**: ${e.uploadedBy ? (e.uploadedBy.name || e.uploadedBy.email) : 'System'}`
      ).join('\n\n');

      reply = `### 🔍 Evidence Search Results for "${prompt}"
Found **${searchResults.length}** matching evidence items in database:

${resultsText}`;

    } else {
      reply = `### 🔍 Evidence Search for "${prompt}"
No evidence items matching **"${prompt}"** were found in the database.

**Available Recent Evidence Files (${totalEvidence} Total):**
${latestEvidence.length > 0 ? recentFileList : 'No evidence files uploaded yet.'}

> **Tip**: You can upload new files titled or tagged with **"${prompt}"** in the **Evidence Files** section to track them here instantly.`;
    }

    return res.json({
      reply,
      source: 'CivicEvidence Intelligent Forensic Engine',
      liveData: { totalEvidence, totalCases, totalAudits }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({ message: 'Failed to process AI chat query.', error: error.message });
  }
};

/**
 * Get AI Quick Stats Summary
 * @route GET /api/ai/quick-stats
 * @access Private
 */
exports.getQuickStats = async (req, res) => {
  try {
    const [evidenceCount, caseCount, auditCount] = await Promise.all([
      Evidence.countDocuments({ isDeleted: false }),
      Case.countDocuments({ isDeleted: false }),
      AuditLog.countDocuments()
    ]);

    res.json({
      evidenceCount,
      caseCount,
      auditCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI quick stats' });
  }
};
