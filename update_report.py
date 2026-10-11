import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_report_docx():
    doc = Document()

    # Page Margins: 1 inch (72 pt) all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    def set_cell_background(cell, fill_hex):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def add_title(text, level=1):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(6)
        run = h.add_run(text)
        run.font.name = 'Times New Roman'
        run.bold = True

        if level == 1:
            h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run.font.size = Pt(16)
            run.font.color.rgb = RGBColor(15, 23, 42)
        elif level == 2:
            h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(30, 41, 59)
        elif level == 3:
            h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run.font.size = Pt(12.5)
            run.font.color.rgb = RGBColor(51, 65, 85)
        return h

    def format_table(table, col_widths, headers, rows):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = table.rows[0].cells
        for j, title in enumerate(headers):
            hdr_cells[j].text = title
            set_cell_background(hdr_cells[j], "1E293B")
            p = hdr_cells[j].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(10.5)
                run.font.color.rgb = RGBColor(255, 255, 255)
        
        for i, row_data in enumerate(rows):
            row_cells = table.rows[i + 1].cells
            fill_color = "F8FAFC" if i % 2 == 0 else "FFFFFF"
            for j, val in enumerate(row_data):
                row_cells[j].text = str(val)
                set_cell_background(row_cells[j], fill_color)
                p = row_cells[j].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if j > 0 else WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.color.rgb = RGBColor(30, 41, 59)

        for row in table.rows:
            for j, w in enumerate(col_widths):
                row.cells[j].width = Inches(w)

    # ==================== COVER PAGE ====================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_inst.add_run("RAMCO INSTITUTE OF TECHNOLOGY, RAJAPALAYAM\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING")
    r.font.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(18)

    p_code = doc.add_paragraph()
    p_code.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_code.add_run("CS3711 – SUMMER INTERNSHIP\nINTERNSHIP REPORT\n\nCIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM")
    r.font.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(24)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_sub.add_run("Submitted by\n\nKATHIR VEL N.S\nRegister No: 953623104049\n\nBACHELOR OF ENGINEERING\nCOMPUTER SCIENCE AND ENGINEERING")
    r.font.bold = True
    r.font.size = Pt(12)

    doc.add_paragraph().paragraph_format.space_after = Pt(24)

    p_comp = doc.add_paragraph()
    p_comp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_comp.add_run("CLOUDSTRAND PRIVATE LIMITED\nSoftware Engineering & Cybersecurity Division\n\nINTERNSHIP DURATION: 23.07.2026 – 22.08.2026\nOCTOBER 2026")
    r.font.bold = True
    r.font.size = Pt(12)

    doc.add_page_break()

    # ==================== BONAFIDE CERTIFICATE ====================
    add_title("BONAFIDE CERTIFICATE", level=1)
    p_cert = doc.add_paragraph()
    p_cert.paragraph_format.line_spacing = 1.5
    p_cert.add_run(
        "Certified that this Internship Report entitled “CIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM WITH APPLIED CRYPTOGRAPHY AND REAL-TIME AI ASSISTANT” "
        "is the bonafide work of KATHIR VEL N.S (953623104049), who carried out the Summer Internship at CLOUDSTRAND PRIVATE LIMITED, under the supervision of Mr. Panner Selvam."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    table_sig = doc.add_table(rows=2, cols=2)
    table_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    c0 = table_sig.rows[0].cells[0].paragraphs[0]
    c1 = table_sig.rows[0].cells[1].paragraphs[0]
    c0.add_run("SIGNATURE\nFACULTY IN CHARGE\n\nMs. Rajarajeswari P,\nAssistant Professor,\nDepartment of CSE,\nRamco Institute of Technology").font.bold = True
    c1.add_run("SIGNATURE\nHEAD OF THE DEPARTMENT\n\nDr. Vijayalakshmi K,\nProfessor & Head,\nDepartment of CSE,\nRamco Institute of Technology").font.bold = True

    doc.add_page_break()

    # ==================== DECLARATION ====================
    add_title("DECLARATION", level=1)
    p_dec = doc.add_paragraph()
    p_dec.paragraph_format.line_spacing = 1.5
    p_dec.add_run(
        "I hereby declare that this report presents the work carried out by me during the Summer Internship "
        "at CLOUDSTRAND PRIVATE LIMITED for the specified duration (23.07.2026 – 22.08.2026) and that the information "
        "presented is true to the best of my knowledge."
    )
    
    doc.add_paragraph().paragraph_format.space_after = Pt(60)
    p_sig = doc.add_paragraph()
    p_sig.add_run("Date: ________________________                      Signature: ________________________")

    doc.add_page_break()

    # ==================== EXECUTIVE SUMMARY ====================
    add_title("EXECUTIVE SUMMARY", level=1)
    
    p_es1 = doc.add_paragraph()
    p_es1.add_run(
        "The Summer Internship at CLOUDSTRAND PRIVATE LIMITED provided valuable practical exposure to software development, web technologies, computer networking, cybersecurity, and system monitoring in an industry-oriented environment. As part of the internship, the project titled “CivicEvidence – Secure Digital Evidence Management System (DEMS)” was developed to provide a secure web-based interface for managing, encrypting, and monitoring digital evidence files. The project provided an opportunity to apply theoretical knowledge gained during the Bachelor of Engineering in Computer Science and Engineering to a practical software, cryptographic, and AI-driven security application."
    )

    p_es2 = doc.add_paragraph()
    p_es2.add_run(
        "The primary objective of the project was to develop a centralized web dashboard through which digital evidence files could be ingested, encrypted, integrity-checked, and monitored across an immutable Chain of Custody audit trail. The system was designed using the MERN stack (MongoDB, Express.js, React 18, Node.js), with applied cryptography (AES-256 Envelope Encryption and SHA-256 Hashes) used for securing evidence files and logs. The CivicEvidence system was configured to operate locally with backend API services on port 5002 and frontend dev server on port 5175. The web-based dashboard provided important features such as 4-tier Role-Based Access Control (Admin, Officer, Investigator, User), 2FA OTP authentication, live evidence status monitoring, activity logging, and an embedded AI Forensic Assistant. These features reduced the dependency on manual file management and provided a tamper-evident mechanism to guarantee evidence admissibility in court."
    )

    p_es3 = doc.add_paragraph()
    p_es3.add_run(
        "The implementation involved several stages, beginning with understanding the project requirements, digital evidence legal standards (ISO 27037 and NIST SP 800-86), and cryptographic data protection principles. The development process included designing the glassmorphic dark-mode dashboard interface, implementing the Express.js backend API, establishing cryptographic envelope encryption pipeline using Node.js native crypto modules, and developing monitoring, audit logging, and AI assistant query functionality. The system was structured into different functional components so that authentication, evidence encryption, role clearance enforcement, audit logging, and AI-assisted search could be handled systematically. The project was developed and tested in a development environment using tools such as Visual Studio Code, Terminal, Node.js, Express, MongoDB, React, Vite, and cURL."
    )

    p_es4 = doc.add_paragraph()
    p_es4.add_run(
        "During the internship, practical knowledge of cryptographic data protection, token-based authentication, and network communication was developed. The working of AES-256-GCM envelope encryption, SHA-256 cryptographic hashing, JWT authentication, and RESTful API client-server communication was studied and implemented as part of the project. The system was tested using command-line tools, HTTP requests, and Node.js test scripts to verify whether file uploads were successfully encrypted, hashes stored in MongoDB, and audit trails logged. The use of cURL and Node.js test scripts helped in testing API endpoints, authorization headers, and verifying server responses from the CivicEvidence backend."
    )

    p_es5 = doc.add_paragraph()
    p_es5.add_run(
        "Testing and debugging formed an important part of the project development process. Several aspects of the system, including backend route authorization, JWT refresh token rotation, password complexity regex enforcers, OTP email dispatching via Nodemailer, live MongoDB regex search in the AI Assistant, and file decryption pipelines, were tested during implementation. When issues occurred—such as CORS proxy routing, MongoDB populate paths, or missing React icon exports—the relevant configuration, server process, API request, and application logic were examined systematically. Debugging and repeated testing helped identify problems and improve the reliability of the implemented functions. This process provided practical experience in troubleshooting full-stack web and security applications rather than depending only on theoretical concepts."
    )

    p_es6 = doc.add_paragraph()
    p_es6.add_run(
        "The internship also provided exposure to important software development and security practices such as requirement analysis, threat modeling, system design, applied cryptography, functional testing, debugging, technical documentation, and local deployment. The project required continuous interaction between the user interface, Express backend, MongoDB database, and AI forensic intelligence engine to ensure a seamless, court-admissible Digital Evidence Management System."
    )

    doc.add_page_break()

    # ==================== TABLE OF CONTENTS ====================
    add_title("TABLE OF CONTENTS", level=1)
    toc_data = [
        ("1", "Organization and Industry Exposure (Cloudstrand Private Limited)", "1"),
        ("2", "Internship Objectives and Learning Targets", "4"),
        ("3", "Problem / Requirement Identification and Analysis", "5"),
        ("4", "Solution Design and Methodology", "8"),
        ("5", "Implementation and Technical Execution", "15"),
        ("6", "Testing, Results and Deployment", "20"),
        ("7", "Industry / Professional Learning", "22"),
        ("8", "Internship Activity Log", "23"),
        ("9", "Evidence of Internship Work", "24"),
        ("10", "Course Outcome Attainment Evidence", "31"),
        ("11", "Conclusion", "31"),
        ("12", "References / Resources", "31"),
        ("A", "Appendix A – Selected Code / Technical Artifacts", "32"),
        ("B", "Appendix B – Internship Certificate", "33"),
        ("C", "Appendix C – Internship Presentation Evaluation Score Sheet", "34")
    ]
    t_toc = doc.add_table(rows=len(toc_data) + 1, cols=3)
    format_table(t_toc, [0.8, 4.7, 1.0], ["S.No", "Topics", "Page No"], toc_data)

    doc.add_page_break()

    # ==================== SECTION 1 ====================
    add_title("1. ORGANIZATION AND INDUSTRY EXPOSURE", level=1)
    add_title("1.1 Organization Profile", level=2)
    doc.add_paragraph(
        "CLOUDSTRAND PRIVATE LIMITED is a software engineering and cybersecurity solutions organization providing enterprise-grade software development, "
        "cloud architecture, cryptographic security auditing, and artificial intelligence solutions to industry clients. The internship was completed within the "
        "Cybersecurity and Full-Stack Systems division at Cloudstrand, where exposure was gained to industrial software development standards, version control workflows, "
        "applied cryptography, secure backend API design, and client-side UI/UX engineering."
    )

    add_title("1.2 Internship Role and Responsibilities", level=2)
    doc.add_paragraph(
        "As a Full-Stack Software Engineering and Security Intern at CLOUDSTRAND PRIVATE LIMITED, I was responsible for designing, implementing, testing, and documenting "
        "the CivicEvidence Digital Evidence Management System. My primary responsibilities included:\n"
        "• Designing and implementing the RESTful backend API using Node.js, Express.js, and MongoDB (Mongoose ODM).\n"
        "• Engineering the Applied Cryptography Engine using Node.js native 'crypto' module for AES-256-GCM envelope encryption and SHA-256 hashing.\n"
        "• Implementing the Role-Based Access Control (RBAC) middleware enforcing 4-tier clearance (Admin, Officer, Investigator, User).\n"
        "• Building the central email dispatch service using Nodemailer (Gmail SMTP transport) for 2FA OTP codes and password reset workflows.\n"
        "• Developing the glassmorphic React 18 frontend dashboard using Vite, React Router v6, custom CSS design tokens, and interactive eye password toggles.\n"
        "• Designing and implementing the AI Forensic Assistant component (AiChatAssistant.jsx) featuring live MongoDB regex search and Google Gemini API integration."
    )

    add_title("1.3 Industry Practices and Processes Observed", level=2)
    doc.add_paragraph(
        "During the internship at Cloudstrand, industry-standard software development workflows were followed:\n"
        "• Requirement Analysis & System Specification: Defining clear technical constraints, threat models, and user role boundaries.\n"
        "• Modular Architecture & Clean Code: Structuring controllers, routes, models, middleware, and services into decoupled layers.\n"
        "• Defensive Security Programming: Using Helmet HTTP security headers, CORS policy controls, express-rate-limit brute force limiters, and regex password complexity validators.\n"
        "• Iterative Testing & Debugging: Conducting end-to-end API testing using cURL and Node.js test scripts prior to deployment."
    )

    add_title("1.4 Tools, Technologies and Platforms", level=2)
    t1_headers = ["Category", "Tool / Technology", "Purpose / Usage", "Level of Exposure"]
    t1_data = [
        ["Frontend Framework", "React 18, Vite 5, React Router", "Single Page Application (SPA) dashboard design", "Advanced"],
        ["Backend Runtime", "Node.js, Express.js", "RESTful API services and middleware processing", "Advanced"],
        ["Database", "MongoDB, Mongoose ODM", "Document database for evidence metadata and logs", "Intermediate"],
        ["Cryptography", "Node.js native 'crypto' module", "AES-256 envelope encryption and SHA-256 hashing", "Advanced"],
        ["Authentication", "JWT, bcryptjs, Nodemailer", "Token security, password hashing, 2FA OTP mailer", "Advanced"],
        ["AI Integration", "Google Gemini API (gemini-1.5-flash)", "Conversational AI assistant & LLM query handling", "Intermediate"]
    ]
    t1 = doc.add_table(rows=len(t1_data) + 1, cols=4)
    format_table(t1, [1.5, 1.8, 2.2, 1.0], t1_headers, t1_data)

    doc.add_page_break()

    # ==================== SECTION 2 ====================
    add_title("2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS", level=1)
    t2_headers = ["Objective", "Expected Learning / Skill Target", "Evidence from Internship"]
    t2_data = [
        ["O1", "Understand applied cryptography and secure evidence storage principles", "Implemented AES-256 envelope encryption and SHA-256 integrity checksums in backend"],
        ["O2", "Analyze and design role-based access control and audit log systems", "Designed 4-tier RBAC middleware and ISO 27037 compliant Chain of Custody audit logger"],
        ["O3", "Develop full-stack MERN application with real-time AI assistant", "Built React 18 frontend dashboard and Node.js backend with AI Forensic Assistant"],
        ["O4", "Improve technical documentation, system testing, and deployment skills", "Executed test suites, prepared technical report, and configured local deployment"]
    ]
    t2 = doc.add_table(rows=len(t2_data) + 1, cols=3)
    format_table(t2, [1.0, 2.5, 3.0], t2_headers, t2_data)

    doc.add_page_break()

    # ==================== SECTION 3 ====================
    add_title("3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS", level=1)
    add_title("3.1 Background and Context", level=2)
    doc.add_paragraph(
        "In modern law enforcement and judicial proceedings, digital evidence (such as CCTV video recordings, wiretaps, crime scene photos, and forensic disk dumps) "
        "serves as critical proof in court. However, managing digital evidence introduces severe challenges regarding file authenticity, unauthorized access, and evidentiary admissibility."
    )

    add_title("3.2 Problem Statement", level=2)
    doc.add_paragraph(
        "Traditional file management systems suffer from major security vulnerabilities:\n"
        "1. Risk of Data Tampering: Files stored without cryptographic hashes can be modified or corrupted without detection, invalidating court evidence.\n"
        "2. Broken Chain of Custody: Standard server directories fail to log who accessed, viewed, downloaded, or shared evidence, violating ISO 27037 standards.\n"
        "3. Unencrypted Plaintext Storage: Files saved in plain text on server hard drives expose sensitive legal artifacts to data breaches and insider threats.\n"
        "4. Slow Manual Investigation: Investigators waste hours sifting through unstructured file folders to locate relevant evidence artifacts."
    )

    add_title("3.3 Requirements and Constraints", level=2)
    t3_headers = ["Type", "Requirement / Constraint", "Priority / Impact"]
    t3_data = [
        ["Functional", "AES-256 Envelope Encryption, SHA-256 Integrity Checks, ISO 27037 Audit Logs", "High"],
        ["Non-Functional", "Sub-second AI search response, glassmorphic dark-mode UI, password visibility toggles", "High"],
        ["Technical", "Node.js crypto, JWT auth, MongoDB, Express, React 18, Vite", "High"],
        ["Operational", "Local disk storage (backend/uploads/) & central Gmail SMTP mailer (sasukei7074@gmail.com)", "Medium"]
    ]
    t3 = doc.add_table(rows=len(t3_data) + 1, cols=3)
    format_table(t3, [1.5, 3.8, 1.2], t3_headers, t3_data)

    doc.add_page_break()

    # ==================== SECTION 4 ====================
    add_title("4. SOLUTION DESIGN AND METHODOLOGY", level=1)
    add_title("4.1 Proposed Solution", level=2)
    doc.add_paragraph(
        "CivicEvidence provides a secure, web-based DEMS platform that combines Applied Cryptography, Role-Based Access Control, and AI Intelligence:\n"
        "• SHA-256 Checksums: Computes cryptographic hashes upon ingestion to detect bit-level tampering instantly.\n"
        "• AES-256 Envelope Encryption: Encrypts files at rest with dedicated Data Encryption Keys (DEKs) protected by a Master Key.\n"
        "• ISO 27037 Audit Logger: Automatically records user ID, IP address, device user-agent, and exact timestamp for every action.\n"
        "• Smart AI Assistant: Floating glassmorphic chat widget performing live MongoDB regex evidence lookup and legal compliance guidance."
    )

    add_title("4.2 System Architecture & Component Design", level=2)
    t4_headers = ["Module / Component", "Purpose", "Inputs", "Processing", "Outputs"]
    t4_data = [
        ["Authentication Module", "Secure user access & 2FA OTP", "Login credentials, OTP codes", "bcrypt hashing, JWT generation, OTP verification", "JWT Token, Auth state"],
        ["Cryptographic Engine", "File encryption & hash checking", "Raw evidence file binary", "SHA-256 hash calc, AES-256-GCM encryption", "Encrypted blob, Hex DEK/IV, Hash"],
        ["Audit Logger Module", "Chain of Custody recording", "User request context", "Extracts IP, User-Agent, Action, Target", "Immutable Audit Record"],
        ["AI Assistant Module", "Conversational search & stats", "Natural language user prompt", "Live MongoDB regex query / Gemini API call", "Markdown response, Live stats"],
        ["Role Clearance Guard", "Enforce 4-tier RBAC access", "User token & role", "Validates role clearance against route policies", "Access granted / 403 Forbidden"]
    ]
    t4 = doc.add_table(rows=len(t4_data) + 1, cols=5)
    format_table(t4, [1.3, 1.4, 1.2, 1.4, 1.2], t4_headers, t4_data)

    doc.add_page_break()

    # ==================== SECTION 5 ====================
    add_title("5. IMPLEMENTATION AND TECHNICAL EXECUTION", level=1)
    add_title("5.1 Technical Execution & File Mappings", level=2)
    t5_headers = ["Task / Module", "My Individual Contribution", "Tools / Technologies Used", "Evidence / Output File"]
    t5_data = [
        ["Server Entry Point", "Configured Express server, Helmet, CORS, and rate limiters", "Node.js, Express, Helmet", "backend/server.js"],
        ["Auth & 2FA OTP", "Implemented login, registration, password regex, and OTP verification", "bcryptjs, JWT, Nodemailer", "backend/controllers/authController.js"],
        ["Email Service", "Configured central Gmail SMTP transporter for sasukei7074@gmail.com", "Nodemailer, Gmail App Password", "backend/services/emailService.js"],
        ["Crypto Engine", "Implemented SHA-256 checksums and AES-256-GCM envelope encryption", "Node.js native 'crypto'", "backend/controllers/evidenceController.js"],
        ["Audit Logger", "Built automated ISO 27037 compliant Chain of Custody tracking", "MongoDB, Express Middleware", "backend/utils/auditLogger.js"],
        ["AI Assistant Engine", "Engineered live MongoDB regex search and Gemini LLM fallback", "Node.js, Express, Gemini API", "backend/controllers/aiController.js"],
        ["AI Assistant UI", "Designed floating glassmorphic chat widget component", "React 18, Vite, Custom CSS", "frontend/src/components/common/AiChatAssistant.jsx"]
    ]
    t5 = doc.add_table(rows=len(t5_data) + 1, cols=4)
    format_table(t5, [1.3, 2.2, 1.5, 1.5], t5_headers, t5_data)

    doc.add_page_break()

    # ==================== SECTION 6 ====================
    add_title("6. TESTING, RESULTS AND DEPLOYMENT", level=1)
    add_title("6.1 Test Cases and Validation", level=2)
    t6_headers = ["Test Case ID", "Scenario / Input", "Expected Result", "Actual Result", "Status"]
    t6_data = [
        ["TC01", "User Registration with Weak Password", "Reject with password complexity alert", "Alert displayed (8+ chars, upper, lower, symbol required)", "PASS"],
        ["TC02", "Upload Evidence File (image/video/doc)", "Calculate SHA-256 hash & AES-256 encrypt blob", "Hash stored in DB, encrypted file saved in backend/uploads/", "PASS"],
        ["TC03", "Download Evidence File", "Recompute SHA-256 hash & decrypt blob", "Hash verified matching; file decrypted cleanly", "PASS"],
        ["TC04", "AI Assistant Query ('bank robbery files')", "Perform live MongoDB regex search", "Returns matching evidence titles, original filenames & SHA-256 hashes", "PASS"],
        ["TC05", "Password Reset via 2FA OTP", "Verify 6-digit OTP code & set isEmailVerified=true", "Password updated, email verified, login succeeds without warning", "PASS"]
    ]
    t6 = doc.add_table(rows=len(t6_data) + 1, cols=5)
    format_table(t6, [0.8, 1.8, 1.6, 1.7, 0.6], t6_headers, t6_data)

    doc.add_page_break()

    # ==================== SECTION 7 ====================
    add_title("7. INDUSTRY / PROFESSIONAL LEARNING", level=1)
    doc.add_paragraph(
        "7.1 Technical Skills Acquired: Gained hands-on proficiency in applied cryptography (AES-256, SHA-256), Node.js native crypto APIs, JWT authentication, "
        "MERN full-stack development, Express rate-limiting, Nodemailer 2FA email services, and Google Gemini AI API integration.\n\n"
        "7.2 Problem-Solving & Decision-Making: Diagnosed and resolved real-world security challenges such as resolving proxy CORS errors, handling Node.js populate errors, "
        "fixing Vite React icon import crashes, and ensuring email verification flags update automatically upon OTP password reset.\n\n"
        "7.3 Teamwork & Industry Practices: Learned industrial software engineering workflows at Cloudstrand, including version control, modular code separation, and threat modeling."
    )

    doc.add_page_break()

    # ==================== SECTION 8 ====================
    add_title("8. INTERNSHIP ACTIVITY LOG", level=1)
    t7_headers = ["Week", "Activity / Task Completed", "Technical Learning", "Outcome / Evidence"]
    t7_data = [
        ["Week 1", "Requirement analysis, architecture design, and database schema setup", "MongoDB Mongoose schemas (User, Evidence, Case, AuditLog)", "Database models created"],
        ["Week 2", "Backend API implementation, JWT auth, Nodemailer 2FA OTP mailer", "Node.js, Express, Nodemailer SMTP transport", "Auth controller & email service active"],
        ["Week 3", "Applied Cryptography engine (AES-256/SHA-256) & Audit Logger", "Node.js 'crypto' module, ISO 27037 audit tracking", "Evidence upload/download & audit logs working"],
        ["Week 4", "AI Assistant engine integration, Vite React UI dashboard & final testing", "React 18, Vite, AI Regex Search, Gemini API", "Fully functional CivicEvidence DEMS platform"]
    ]
    t7 = doc.add_table(rows=len(t7_data) + 1, cols=4)
    format_table(t7, [0.8, 2.4, 2.0, 1.3], t7_headers, t7_data)

    doc.add_page_break()

    # ==================== SECTION 9 & 10 ====================
    add_title("9. EVIDENCE OF INTERNSHIP WORK & CO MAPPING", level=1)
    doc.add_paragraph(
        "The completed project demonstrates attainment of Course Outcomes (CO1 to CO4):\n"
        "• CO1 - Industry Practices & Technology: Applied MERN stack, Node.js crypto, Nodemailer, and Vite in an industrial setup at Cloudstrand.\n"
        "• CO2 - Problem Analysis & Solution Design: Designed multi-layer AES-256 envelope encryption and ISO 27037 audit trail architecture.\n"
        "• CO3 - Build and Deploy Solutions: Built and verified full-stack DEMS platform running on port 5002 (backend) and 5175 (frontend).\n"
        "• CO4 - Technical Documentation & Reporting: Authored technical documentation, presentation deck, and formal internship report."
    )

    doc.add_page_break()

    # ==================== SECTION 11 & 12 ====================
    add_title("11. CONCLUSION", level=1)
    doc.add_paragraph(
        "The Summer Internship at CLOUDSTRAND PRIVATE LIMITED provided invaluable technical and industry exposure. "
        "The developed project, CivicEvidence DEMS, successfully addresses the critical vulnerabilities of traditional evidence storage by combining "
        "mathematical SHA-256 integrity verification, AES-256 envelope encryption, ISO 27037 Chain of Custody audit trails, and real-time AI forensic search. "
        "The system provides an enterprise-ready, court-admissible solution for modern digital evidence management."
    )

    add_title("12. REFERENCES / RESOURCES", level=2)
    doc.add_paragraph(
        "[1] ISO/IEC 27037:2012 – Guidelines for identification, collection, acquisition, and preservation of digital evidence.\n"
        "[2] NIST SP 800-86 – Guide to Integrating Forensic Techniques into Incident Response.\n"
        "[3] Node.js Crypto Documentation – https://nodejs.org/api/crypto.html\n"
        "[4] React 18 & Vite Documentation – https://vitejs.dev/\n"
        "[5] Google Gemini API Documentation – https://ai.google.dev/"
    )

    docx_path = "CivicEvidence_Internship_Report_Cloudstrand.docx"
    doc.save(docx_path)
    print(f"SUCCESS: {docx_path} updated successfully.")

    pdf_path = "CivicEvidence_Internship_Report_Cloudstrand.pdf"
    try:
        from docx2pdf import convert
        print("Converting updated report to PDF via docx2pdf...")
        convert(os.path.abspath(docx_path), os.path.abspath(pdf_path))
        print(f"SUCCESS: {pdf_path} updated successfully.")
    except Exception as e:
        print("PDF conversion note:", e)

if __name__ == "__main__":
    create_report_docx()
