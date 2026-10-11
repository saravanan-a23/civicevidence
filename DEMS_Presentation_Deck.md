# 🛡️ CIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM (DEMS)
## Project Presentation Slide Deck & Technical Dossier
---

## 🖥️ Slide 1: Title Slide
* **Project Title**: CivicEvidence
* **Subtitle**: Secure Cloud-Ready Digital Evidence Management System (DEMS)
* **Target Audience**: Academic Panels, Technical Leads, and Security Evaluators
* **Core Value**: Maintaining absolute chain of custody and file integrity through AES-256 envelope encryption, SHA-256 cryptographic signatures, and immutable logging.

---

## 📋 Slide 2: The Problem & The Solution
### The Problem:
* **Evidence Tampering**: Lack of cryptographic verification of files leads to legal challenges.
* **Loose Access Control**: Unauthorized personnel viewing or downloading sensitive case files.
* **Untraceable Actions**: No record of who viewed or downloaded a file.
* **Storage Inefficiencies**: Difficulty in tracking file updates and rollbacks.

### The Solution (CivicEvidence):
* **Cryptographic Signatures**: SHA-256 hashes generated on upload are checked on download.
* **Envelope Encryption**: Files are encrypted before write; keys are stored separate from payloads.
* **Immutable Custody Logs**: Auto-captures IP, device, browser, and actions.
* **Granular Clearance Tiers**: Active role-based controls (RBAC) separating Admin, Officer, and User roles.

---

## 🏗️ Slide 3: High-Level System Architecture
```
                     +---------------------------------------+
                     |           React SPA Client            |
                     |  (Vite, TS, Tailwind-free Custom CSS)  |
                     +---------------------------------------+
                                         |
                                         | (HTTPS / Rest Calls)
                                         v
                     +---------------------------------------+
                     |           Express.js API              |
                     |    (Helmet Headers, Rate Limiter)     |
                     +---------------------------------------+
                       /                 |                 \
                      /                  |                  \
                     v                   v                   v
           +------------------+  +-----------------+  +-------------------+
           |    MongoDB DB    |  |  AES Encryption |  | Dual-Storage Mgr  |
           |  (Mongoose ORM)  |  |  (Crypto envelope) |  | (S3 / Local fallback)|
           +------------------+  +-----------------+  +-------------------+
```
* **Separation of Concerns**: Pure front-end UI interface, secure stateless REST APIs, and separated database metadata and binary file storage.

---

## 🗃️ Slide 4: Database ERD Schema Design
* **Users Collection**: Stores names, roles (`admin`, `officer`, `user`), status (`active`, `inactive`), and email verification parameters.
* **Evidence Collection**: Contains file size, MIME type, case association, SHA-256 hash, and file-specific encrypted AES keys/IVs.
* **Cases Collection**: Aggregates files under unique case IDs (e.g. `CASE-2026-9428`), tracking leads and investigation progress.
* **Permissions Collection**: Manages temporary shared access rules containing specific permission levels (`read` or `download`) and expiration dates.
* **AuditLogs Collection**: Stores immutable audit trails capturing who, what, when, where (IP, device OS), and action statuses.
* **Versions Collection**: Tracks historic file changes and supports rollback procedures.

---

## 🔒 Slide 5: Envelope Encryption & Integrity Workflow
### File Upload Sequence:
1. **Hash Generation**: Backend reads upload stream and calculates SHA-256 hash.
2. **Key Generation**: Cryptographically random 256-bit file key and 128-bit IV generated.
3. **Payload Encryption**: Core file buffer encrypted using AES-256-CBC with the file key.
4. **Envelope Encryption**: The file key is encrypted with the global `MASTER_ENCRYPTION_KEY` from `.env`.
5. **Storage**: Encrypted file saved to S3/uploads; metadata (hash, IV, encrypted file key) saved in MongoDB.

### File Download Sequence:
1. **Access Check**: System checks if user is Admin, Officer, Owner, or holds active Shared Permission.
2. **Key Decryption**: Encrypted file key decrypted using `MASTER_ENCRYPTION_KEY`.
3. **Payload Decryption**: Encrypted file stream retrieved and decrypted using file key and IV.
4. **Integrity Audit**: Hashes compared. If matched, download completes; if mismatched, triggers a security breach alert.

---

## 👥 Slide 6: Role-Based Access Control (RBAC) Matrix
| Feature / clearance | Standard User | Investigation Officer | System Administrator |
| :--- | :---: | :---: | :---: |
| **Upload personal files** | ✔ | ✔ | ✔ |
| **Download personal files** | ✔ | ✔ | ✔ |
| **Download shared files** | ✔ (If granted) | ✔ | ✔ |
| **Create investigation cases** | ❌ | ✔ | ✔ |
| **Share files with others** | ❌ | ✔ | ✔ |
| **Inspect system audit trails** | ❌ | ✔ | ✔ |
| **Approve pending accounts** | ❌ | ❌ | ✔ |
| **Manage user roles / status** | ❌ | ❌ | ✔ |
| **Restore soft-deleted files** | ❌ | ❌ | ✔ |

---

## 🛠️ Slide 7: Security Protocols & Hardening
* **Bcrypt Hashing**: Enforces salt iterations for credentials storage.
* **JWT Tokens**: Secure bearer tokens used for stateless route protection.
* **Strict Input Validations (Regex)**:
  * **Email**: Enforces standard RFC email formats.
  * **Password Complexity**: Enforces at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special symbol. Enforced on registration, login, and password reset endpoints.
* **Helmet Security Headers**: Blocks XSS, Clickjacking, and MIME Sniffing.
* **Rate Limiters**: Restricts API calls to 100 requests per 15 minutes for auth endpoints to prevent brute-force attacks.

---

## 💻 Slide 8: Technical Stack Selection
### Frontend:
* **React.js**: Modular component layout.
* **TypeScript & Vite**: Rapid transpilation and static typing.
* **Tailwind-free Custom HSL CSS**: High-fidelity glassmorphism themes supporting dark/light mode toggle.
* **Recharts**: Responsive SVG graphs.
* **React Hot Toast**: Micro-animations.

### Backend:
* **Node.js & Express.js**: Asynchronous REST APIs routing.
* **Mongoose & MongoDB Atlas**: Dynamic BSON schemas.
* **Crypto & Multer**: AES payload encryption stream.
* **AWS SDK**: Dual-mode storage (ready for S3 deployment with local fallback).

---

## 🔮 Slide 9: Future Scope & Production Roadmap
* **MFA (Multi-Factor Authentication)**: Integrating SMS/TOTP codes.
* **Virus Scanning Pipelines**: Hooking ClamAV or AWS GuardDuty to inspect payloads before encryption.
* **PDF Report Exports**: Generating signed custody summaries for court submissions.
* **Multi-device Session Audits**: Tracking active JWT session tokens and user IPs.
* **AWS Lambda & GCS Cloud Deployments**: Serverless computing modules.

---

## 🏁 Slide 10: Summary & Live Verification
* **Production-Ready Core**: The system is fully developed, tested, and running locally.
* **E2E Test Verified**: Validated registration, OTP verification, login JWT creation, case indexing, AES encryption uploads, and decryption checks successfully.
* **Clean Architecture**: Follows clean architecture, SOLID design, proper error handling, logging, validation, and modern development best practices.
