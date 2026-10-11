import os
import sys
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def build_report():
    print("Initializing document...")
    doc = Document()

    # Base page settings
    # Section 1: Front Matter (Pages 1 to 5)
    sec_fm = doc.sections[0]
    sec_fm.page_width = Inches(8.5)
    sec_fm.page_height = Inches(11.0)
    sec_fm.top_margin = Inches(1.0)
    sec_fm.bottom_margin = Inches(1.0)
    sec_fm.left_margin = Inches(1.0)
    sec_fm.right_margin = Inches(1.0)

    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Colors
    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_TITLE_RED = RGBColor(192, 0, 0) # #C00000 rich red matching PDF 1
    COLOR_CODE_DARK = RGBColor(15, 23, 42)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border(cell, **kwargs):
        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                            f'<w:top w:val="{kwargs.get("top", "single")}" w:sz="{kwargs.get("sz", "4")}" w:space="0" w:color="{kwargs.get("color", "000000")}"/>'
                            f'<w:bottom w:val="{kwargs.get("bottom", "single")}" w:sz="{kwargs.get("sz", "4")}" w:space="0" w:color="{kwargs.get("color", "000000")}"/>'
                            f'<w:left w:val="{kwargs.get("left", "single")}" w:sz="{kwargs.get("sz", "4")}" w:space="0" w:color="{kwargs.get("color", "000000")}"/>'
                            f'<w:right w:val="{kwargs.get("right", "single")}" w:sz="{kwargs.get("sz", "4")}" w:space="0" w:color="{kwargs.get("color", "000000")}"/>'
                            f'</w:tcBorders>')
        tcPr.append(borders)

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, line_spacing=1.15, bold=False, font_size=12, color=COLOR_BLACK, font_name="Times New Roman"):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            r.bold = bold
            r.font.name = font_name
            r.font.size = Pt(font_size)
            r.font.color.rgb = color
        return p

    def add_bullet(text, prefix="➢ ", space_before=2, space_after=3):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        r_pre = p.add_run(prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(12)
        r_pre.bold = True
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        r_text.font.size = Pt(12)
        return p

    def add_sec_title(title_text, space_before=14, space_after=6):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=space_before, space_after=space_after, bold=True, font_size=14, color=COLOR_BLACK)

    def add_subsec_title(title_text, space_before=10, space_after=4):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=space_before, space_after=space_after, bold=True, font_size=12.5, color=COLOR_BLACK)

    def add_table_title(title_text, space_before=10, space_after=6):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=space_before, space_after=space_after, bold=True, font_size=12, color=COLOR_BLACK)

    def format_clean_table(table, col_widths, headers, data, align_cols=None):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Header Row
        hdr_row = table.rows[0]
        for idx, text in enumerate(headers):
            cell = hdr_row.cells[idx]
            cell.text = text
            set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
            set_cell_border(cell, sz="6")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            if p.runs:
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(10.5)
                p.runs[0].font.name = 'Times New Roman'
                p.runs[0].font.color.rgb = COLOR_BLACK

        # Data Rows
        for r_idx, row_vals in enumerate(data):
            row = table.rows[r_idx + 1]
            for c_idx, val in enumerate(row_vals):
                cell = row.cells[c_idx]
                cell.text = str(val)
                set_cell_margins(cell, top=90, bottom=90, left=140, right=140)
                set_cell_border(cell, sz="4")
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.1
                if align_cols and c_idx < len(align_cols):
                    p.alignment = align_cols[c_idx]
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx > 0 else WD_ALIGN_PARAGRAPH.CENTER
                if p.runs:
                    p.runs[0].font.size = Pt(10)
                    p.runs[0].font.name = 'Times New Roman'
                    p.runs[0].font.color.rgb = COLOR_BLACK

        # Column widths
        for row in table.rows:
            for c_idx, w in enumerate(col_widths):
                row.cells[c_idx].width = Inches(w)

    images_dir = r"C:\Users\asara\OneDrive\Documents\cloudevidence\extracted_images"

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    print("Building Page 1: Cover Page...")
    add_p("RAMCO INSTITUTE OF TECHNOLOGY, RAJAPALAYAM", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=4, bold=True, font_size=16)
    add_p("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=14, bold=True, font_size=12)

    # Centered College Crest Logo
    p_logo = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=14)
    logo_path = os.path.join(images_dir, "DOC-2026_image1.jpeg")
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(0.9), height=Inches(1.05))

    add_p("CS3711 - SUMMER INTERNSHIP", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=4, bold=True, font_size=14)
    add_p("INTERNSHIP REPORT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=22, bold=True, font_size=14)

    add_p("CIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=24, bold=True, font_size=16, color=COLOR_TITLE_RED)

    add_p("Submitted by", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=4, bold=False, font_size=14)
    add_p("SARAVANAN A", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, bold=True, font_size=14)
    add_p("(953623104093)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, bold=True, font_size=14)

    add_p("BACHELOR OF ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, bold=True, font_size=14)
    add_p("COMPUTER SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, bold=True, font_size=14)

    add_p("CLOUDSTRAND PRIVATE LIMITED", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, bold=True, font_size=14)
    add_p("CHENNAI", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, bold=True, font_size=14)

    add_p("INTERNSHIP DURATION: 23.07.2026 – 22.08.2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, bold=True, font_size=14)
    add_p("OCTOBER 2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0, bold=True, font_size=12)

    doc.add_page_break()

    # =========================================================================
    # PAGE 2: BONAFIDE CERTIFICATE
    # =========================================================================
    print("Building Page 2: Bonafide Certificate...")
    add_p("BONAFIDE CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=28, bold=True, font_size=14)

    add_p(
        "Certified that this internship report entitled “CIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM WITH APPLIED CRYPTOGRAPHY AND REAL-TIME AI ASSISTANT” "
        "is the bona fide work of “SARAVANAN A (953623104093)” who carried out the internship at CLOUDSTRAND PRIVATE LIMITED under the supervision of Mr. Pon Prabhakar.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=140, line_spacing=1.5, font_size=12
    )

    # 2-column signature table (no borders)
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_left = sig_table.rows[0].cells[0]
    c_right = sig_table.rows[0].cells[1]
    c_left.width = Inches(3.25)
    c_right.width = Inches(3.25)
    set_cell_border(c_left, top="none", bottom="none", left="none", right="none")
    set_cell_border(c_right, top="none", bottom="none", left="none", right="none")

    p_sig_l = c_left.paragraphs[0]
    p_sig_l.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sig_l.paragraph_format.line_spacing = 1.15
    p_sig_l.paragraph_format.space_after = Pt(0)
    r = p_sig_l.add_run("SIGNATURE\nFACULTY IN CHARGE\n\nMs. Rajarajeswari P,\nAssistant Professor,\nDepartment of Computer Science and\nEngineering,\nRamco Institute of Technology,\nRajapalayam")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.bold = True

    p_sig_r = c_right.paragraphs[0]
    p_sig_r.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sig_r.paragraph_format.line_spacing = 1.15
    p_sig_r.paragraph_format.space_after = Pt(0)
    r = p_sig_r.add_run("SIGNATURE\nHEAD OF THE DEPARTMENT\n\nDr. Vijayalakshmi K,\nProfessor/Head,\nDepartment of Computer Science and\nEngineering,\nRamco Institute of Technology,\nRajapalayam")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.bold = True

    doc.add_page_break()

    # =========================================================================
    # PAGE 3: DECLARATION
    # =========================================================================
    print("Building Page 3: Declaration...")
    add_p("DECLARATION", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=28, bold=True, font_size=14)

    add_p(
        "I hereby declare that this report presents the work carried out by me during the Summer Internship "
        "at CLOUDSTRAND PRIVATE LIMITED for the specified duration and that the information presented is true "
        "to the best of my knowledge.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=180, line_spacing=1.5, font_size=12
    )

    p_dt_sig = doc.add_paragraph()
    p_dt_sig.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_dt_sig.paragraph_format.line_spacing = 1.15
    r_dt = p_dt_sig.add_run("Date: ____________                                                                      Signature: __________________")
    r_dt.font.name = 'Times New Roman'
    r_dt.font.size = Pt(12)
    r_dt.bold = True

    doc.add_page_break()

    # =========================================================================
    # PAGE 4: EXECUTIVE SUMMARY
    # =========================================================================
    print("Building Page 4: Executive Summary...")
    add_p("EXECUTIVE SUMMARY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=14, bold=True, font_size=14)

    add_p(
        "The Summer Internship at CLOUDSTRAND PRIVATE LIMITED, Chennai provided valuable practical exposure to full-stack web application development, "
        "applied cryptography, cloud security, role-based access control, and artificial intelligence integration in an industry-oriented environment. "
        "As part of the internship, the project titled “CivicEvidence – Secure Digital Evidence Management System (DEMS)” was developed to address critical "
        "challenges in digital evidence handling, namely data tampering, a broken chain of custody, and unencrypted plaintext storage in law enforcement and forensic applications.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8
    )

    add_p(
        "The primary objective of the project was to develop a full-stack MERN (MongoDB, Express.js, React 18, Node.js) web application that provides mathematical "
        "proof of evidence integrity using SHA-256 cryptographic checksums, secures evidence files at rest using AES-256-GCM envelope encryption, and records an "
        "immutable Chain of Custody audit trail aligned with ISO/IEC 27037 and NIST guidelines. An embedded AI Forensic Assistant was also integrated into the "
        "dashboard, combining real-time MongoDB regex search with optional Google Gemini API integration to help investigators retrieve evidence artifacts and look up compliance guidance.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8
    )

    add_p(
        "The implementation involved requirement analysis, database schema design, development of the REST API, JWT-based authentication with refresh token rotation, "
        "a four-tier role-based access control (RBAC) model, two-factor authentication through email OTP using Nodemailer, an applied cryptography engine built on the native "
        "Node.js crypto module, an ISO 27037 compliant audit logger, and a glassmorphic React 18 dashboard built with Vite. Security middleware such as Helmet, CORS policy "
        "controls and express-rate-limit was used to harden the backend against common web attacks.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8
    )

    add_p(
        "Testing and debugging formed an important part of the development process. Registration validation, evidence upload, download with integrity verification, "
        "AI assistant search and password reset through OTP were tested using cURL, Node.js test scripts and the web interface. Issues such as proxy CORS errors, "
        "Mongoose populate errors, frontend icon import failures and email-verification flag updates were analysed and resolved systematically.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8
    )

    add_p(
        "The internship also provided exposure to professional practices such as requirement analysis, modular system design, defensive security programming, "
        "iterative testing, documentation and local deployment. The completed system was verified in a local environment, with the backend running on port 5002 and the frontend on port 5174.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=0
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 5: TABLE OF CONTENTS
    # =========================================================================
    print("Building Page 5: Table of Contents...")
    add_p("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=14, bold=True, font_size=14)

    toc_items = [
        ("1", "BONAFIDE CERTIFICATE", "ii"),
        ("2", "DECLARATION", "iii"),
        ("3", "EXECUTIVE SUMMARY", "iv"),
        ("4", "ORGANIZATION AND INDUSTRY EXPOSURE", "1"),
        ("5", "INTERNSHIP OBJECTIVES AND LEARNING TARGETS", "5"),
        ("6", "PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS", "6"),
        ("7", "SOLUTION DESIGN AND METHODOLOGY", "9"),
        ("8", "IMPLEMENTATION AND TECHNICAL EXECUTION", "12"),
        ("9", "TESTING, RESULTS AND DEPLOYMENT", "15"),
        ("10", "INDUSTRY / PROFESSIONAL LEARNING", "18"),
        ("11", "INTERNSHIP ACTIVITY LOG", "19"),
        ("12", "EVIDENCE OF INTERNSHIP WORK", "20"),
        ("13", "COURSE OUTCOME ATTAINMENT EVIDENCE", "24"),
        ("14", "CONCLUSION", "25"),
        ("15", "REFERENCES / RESOURCES", "25"),
        ("16", "APPENDIX A – EVIDENCE_CONTROLLER.JS", "26"),
        ("17", "APPENDIX B – INTERNSHIP CERTIFICATE", "30"),
        ("18", "APPENDIX C – OFFER / JOINING LETTER", "31"),
        ("19", "APPENDIX D – INTERNSHIP PRESENTATION EVALUATION SCORE SHEET", "32")
    ]

    t_toc = doc.add_table(rows=len(toc_items) + 1, cols=3)
    format_clean_table(
        t_toc,
        [0.8, 4.7, 1.0],
        ["S. NO.", "CONTENT", "PAGE NO."],
        toc_items,
        align_cols=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER]
    )

    # =========================================================================
    # SECTION 2: MAIN BODY (CONTINUOUS ACADEMIC FLOW, NO ARBITRARY BREAKS)
    # =========================================================================
    print("Building Section 2: Main Body...")
    sec_body = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    sec_body.page_width = Inches(8.5)
    sec_body.page_height = Inches(11.0)
    sec_body.top_margin = Inches(1.0)
    sec_body.bottom_margin = Inches(1.0)
    sec_body.left_margin = Inches(1.0)
    sec_body.right_margin = Inches(1.0)

    # 1. ORGANIZATION AND INDUSTRY EXPOSURE
    add_sec_title("1. ORGANIZATION AND INDUSTRY EXPOSURE")
    add_subsec_title("1.1 Organization Profile")
    add_p(
        "CLOUDSTRAND PRIVATE LIMITED, Chennai is a software engineering and cybersecurity solutions organization that provides "
        "enterprise-grade software development, cloud architecture, cryptographic security auditing and artificial intelligence solutions to industry clients. "
        "The organization develops software solutions for modern communication systems and industrial applications. Cloudstrand focuses on technologies "
        "such as Edge AI, secure communication protocols, Industrial IoT, real-time cryptography, and intelligent software systems. "
        "Its solutions support enterprise applications involving voice, data streaming, messaging, and AI-based audit processing."
    )
    add_p(
        "The organization also works on high-performance and intelligent computing solutions, providing opportunities to explore areas such as AI, "
        "software engineering, data processing, and optimization. During the internship, practical exposure was gained to AI-based information processing, "
        "digital evidence management, applied cryptography, backend development, and software testing through the development of the CivicEvidence project."
    )
    add_p(
        "Domain: Cybersecurity, Applied Cryptography, Full-Stack Web Development, Cloud Security, Artificial Intelligence, and Forensic Data Systems.",
        bold=True
    )

    add_subsec_title("1.2 Internship Role and Responsibilities")
    add_p(
        "During the internship at Cloudstrand Private Limited, I worked as a Full-Stack Software Engineering and Security Intern on the project titled "
        "“CivicEvidence – Secure Digital Evidence Management System”. My role involved understanding the project requirements, analyzing legal forensic "
        "constraints, designing the system architecture, implementing different functional modules, and integrating them into a complete court-admissible solution. "
        "I also worked on cryptographic envelope encryption, audit logging, testing, and benchmarking to evaluate the overall efficiency and reliability of the system."
    )
    add_p("Responsibilities:")
    add_bullet("Studied the fundamentals of digital evidence admissibility, chain of custody, and cryptographic standards including ISO 27037 and NIST SP 800-86.")
    add_bullet("Designed and implemented the core RESTful backend API using Node.js, Express.js and MongoDB (Mongoose ODM).")
    add_bullet("Engineered the applied cryptography engine using the Node.js native crypto module for AES-256-GCM envelope encryption and SHA-256 hashing.")
    add_bullet("Implemented role-based access control (RBAC) middleware enforcing four clearance tiers: Admin, Officer, Investigator and User.")
    add_bullet("Built the central email dispatch service using Nodemailer (Gmail SMTP transport) for two-factor OTP codes and password reset workflows.")
    add_bullet("Developed the glassmorphic React 18 frontend dashboard using Vite, React Router v6, custom CSS design tokens and interactive password visibility toggles.")
    add_bullet("Designed and implemented the AI Forensic Assistant component (AiChatAssistant.jsx) with live MongoDB regex search and Google Gemini API integration.")
    add_bullet("Performed unit, integration, functional, and performance testing & cryptographic integrity verification.")

    add_subsec_title("1.3 Faculty Mentor Interaction:")
    add_p(
        "Regular interaction was maintained with the internship mentor throughout the internship. The progress of the assigned work was updated to the "
        "mentor on a weekly basis. Completed tasks, implementation progress, technical challenges, and outcomes were discussed during these updates. "
        "The mentor provided guidance and feedback whenever required, which helped in improving the implementation and progressing systematically throughout the internship. "
        "The regular mentor interactions also helped in validating the technical approach, identifying areas for improvement and ensuring that the project activities remained aligned with the defined objectives."
    )

    add_subsec_title("1.4 Industry Practices and Processes Observed")
    add_p("During the internship, the following software development practices and processes were observed:")
    add_bullet("Requirement Analysis: Project requirements were understood and divided into smaller technical tasks before implementation.")
    add_bullet("Systematic Development: The project was developed module by module, starting from the core database and gradually adding encryption, access control, and frontend components.")
    add_bullet("Version Control: Changes made during development were maintained using Git version control to manage and track source code.")
    add_bullet("Documentation: Technical details, implementation approaches, testing results, and project progress were documented regularly.")
    add_bullet("Defensive Security Programming: Helmet HTTP security headers, CORS policy controls, express-rate-limit brute-force limiters and regex-based password complexity validators were used.")
    add_bullet("Testing: Different levels of testing, including unit testing, functional testing, integration testing, and API verification using cURL, were carried out.")
    add_bullet("Performance Evaluation: The system was evaluated using measurements such as API response latency, encryption throughput, and verification accuracy.")
    add_bullet("Code Quality: Modular design, input validation, error handling, and reusable components were followed to improve maintainability.")
    add_bullet("Mentor Review: Progress and completed work were presented to the mentor on a weekly basis. Feedback and suggestions were considered for further improvements.")
    add_bullet("Deployment and Demonstration: The completed modules were integrated into the application and tested locally across ports 5002 and 5174.")

    add_subsec_title("1.5 Tools, Technologies and Platforms")
    add_p(
        "The tools and technologies listed in Table I were selected based on their relevance to full-stack web application development, "
        "applied cryptography, security hardening, database modeling, and AI integration during the internship."
    )

    add_table_title("TABLE I: TOOLS, TECHNOLOGIES AND PLATFORMS USED DURING THE INTERNSHIP")
    t1_headers = ["Category", "Tool / Technology", "Purpose / Usage", "Level of Exposure"]
    t1_data = [
        ["Programming", "JavaScript / Node.js", "Full-stack application logic, asynchronous runtime, and API development", "Advanced"],
        ["Frontend", "React 18 / Vite 5", "Single Page Application (SPA) dashboard design and interactive state handling", "Advanced"],
        ["Backend", "Express.js", "RESTful API routes, middleware pipeline, and HTTP request handling", "Advanced"],
        ["Database", "MongoDB / Mongoose", "Persistent document storage for evidence metadata, cases, users, and audit logs", "Intermediate"],
        ["Cryptography", "Node.js crypto module", "AES-256-GCM envelope encryption, DEK wrapping, and SHA-256 hashing", "Advanced"],
        ["Authentication", "JWT / bcryptjs", "Stateless token authentication, refresh rotation, and salted password hashing", "Advanced"],
        ["Email Service", "Nodemailer", "Automated SMTP email dispatch for two-factor OTP codes and password recovery", "Intermediate"],
        ["AI Integration", "Google Gemini API", "Conversational AI assistant and forensic legal guidance LLM integration", "Intermediate"],
        ["Security", "Helmet / Rate-Limit", "HTTP security headers, CORS policy controls, and brute-force protection", "Intermediate"],
        ["Testing & Tools", "cURL / VS Code / Git", "API functional testing, source-code development, and version tracking", "Advanced"]
    ]
    t1 = doc.add_table(rows=len(t1_data) + 1, cols=4)
    format_clean_table(t1, [1.3, 1.8, 2.3, 1.1], t1_headers, t1_data)

    add_p("CO Alignment: CO1 – Industry Practices, Processes, Techniques and Technology.", bold=True, space_before=6, space_after=12)
    add_p(
        "The internship enhanced practical understanding of selecting and applying appropriate tools based on project requirements, while providing practical exposure to using these technologies in a real-world software engineering environment. It also strengthened the ability to adapt to new tools and use them effectively for developing secure systems."
    )

    # 2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS
    add_sec_title("2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS")
    add_p(
        "Table II summarizes the key objectives of the internship, the expected technical and professional learning outcomes, and the evidence demonstrating their achievement. These objectives focus on applied cryptography, secure access control, full-stack development with an AI assistant, and improving technical documentation and testing skills throughout the internship."
    )

    add_table_title("TABLE II: INTERNSHIP OBJECTIVES, EXPECTED LEARNING OUTCOMES, AND EVIDENCE")
    t2_headers = ["Objective", "Expected Learning / Skill", "Evidence from Internship"]
    t2_data = [
        ["O1", "Understand applied cryptography and secure evidence storage principles.", "Implemented AES-256 envelope encryption and SHA-256 integrity checksums in the backend."],
        ["O2", "Analyze the requirements and design role-based access control and audit systems.", "Designed 4-tier RBAC middleware and an ISO 27037 compliant Chain of Custody audit logger."],
        ["O3", "Develop, integrate, test, and run a functional full-stack MERN security application.", "Built the React 18 dashboard, Node.js backend, and integrated AI Forensic Assistant."],
        ["O4", "Develop technical documentation and communicate project progress clearly.", "Maintained project documentation, prepared test results, and provided weekly progress updates."]
    ]
    t2 = doc.add_table(rows=len(t2_data) + 1, cols=3)
    format_clean_table(t2, [0.9, 2.6, 3.0], t2_headers, t2_data)

    add_p(
        "The above objectives provided a structured direction for the internship and guided the overall learning process. The activities carried out helped in developing both technical and professional skills through practical implementation, testing, and system verification.",
        space_before=6, space_after=12
    )

    # 3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS
    add_sec_title("3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS")
    add_subsec_title("3.1 Background and Context")
    add_p(
        "In modern law enforcement and judicial proceedings, digital evidence such as CCTV video recordings, wiretaps, crime scene photographs and forensic disk images serves as critical proof in court. However, managing digital evidence introduces serious challenges regarding file authenticity, unauthorized access and evidentiary admissibility. For digital evidence to be accepted, it must be shown that the evidence has not been altered since collection and that every person who handled it is accounted for. Standards such as ISO/IEC 27037 and NIST SP 800-86 describe the principles for identifying, collecting, acquiring and preserving digital evidence, including the need for an unbroken chain of custody."
    )
    add_p(
        "Many organizations still store such evidence in ordinary shared folders or file servers. These provide no cryptographic proof of integrity, no reliable record of access and no protection if the storage itself is compromised. A dedicated secure system that combines cryptography, access control and auditing was therefore proposed."
    )

    add_subsec_title("3.2 Problem Statement")
    add_p("The project addresses the critical vulnerabilities inherent in traditional digital file storage:")
    add_bullet("Risk of Data Tampering: Files stored without cryptographic hashes can be modified or corrupted without detection, invalidating evidence in court.")
    add_bullet("Broken Chain of Custody: Standard server directories do not log who accessed, viewed, downloaded or shared evidence, which violates ISO 27037 expectations.")
    add_bullet("Unencrypted Plaintext Storage: Files saved in plain text on server disks expose sensitive legal artifacts to data breaches and insider threats.")
    add_bullet("Slow Manual Investigation: Investigators spend considerable time searching unstructured folders to locate relevant evidence.")
    add_p(
        "Therefore, the objective was defined as: “To design and develop a secure, web-based Digital Evidence Management System that guarantees evidence integrity using cryptographic checksums, protects evidence at rest using envelope encryption, records an immutable chain of custody, enforces role-based access, and assists investigators through an AI-based search assistant.”"
    )

    add_subsec_title("3.3 Existing Process / Existing System")
    add_p(
        "Before the proposed system, digital evidence was typically handled using conventional file-server directories, email attachments and manual registers. The existing process suffered from lack of tamper detection, manual non-audited custody tracking, unencrypted plaintext files on disk, and manual slow folder searching. These limitations created the need for an automated, tamper-evident platform capable of enforcing cryptographic integrity and accountability."
    )

    add_subsec_title("3.4 Requirements and Constraints")
    add_p(
        "Table III presents the major functional, non-functional, technical, and operational requirements considered during the design and development of the CivicEvidence system."
    )

    add_table_title("TABLE III: REQUIREMENTS AND CONSTRAINTS OF THE PROPOSED SYSTEM")
    t3_headers = ["Type", "Requirement / Constraint", "Priority"]
    t3_data = [
        ["Functional", "Store and manage encrypted evidence files along with case metadata and tags.", "High"],
        ["Functional", "Enforce AES-256 envelope encryption, SHA-256 integrity verification, and ISO 27037 audit logs.", "High"],
        ["Functional", "Enforce 4-tier Role-Based Access Control (Admin, Officer, Investigator, User).", "High"],
        ["Functional", "Provide 2FA authentication via 6-digit email OTP and secure password recovery.", "High"],
        ["Functional", "Provide a smart AI Forensic Assistant for natural-language search and legal compliance guidance.", "Medium"],
        ["Non-functional", "The system should deliver sub-second AI search response and cryptographic verification.", "High"],
        ["Non-functional", "The system should provide a modern glassmorphic interface that is reliable and maintainable.", "Medium"],
        ["Technical", "Node.js native crypto module, JWT authentication with token rotation, MongoDB, React 18, Vite.", "High"],
        ["Operational", "The system should run in the available development environment with local uploads and central Gmail SMTP.", "Medium"]
    ]
    t3 = doc.add_table(rows=len(t3_data) + 1, cols=3)
    format_clean_table(t3, [1.4, 4.1, 1.0], t3_headers, t3_data)

    add_subsec_title("3.5 Problem Analysis")
    add_p(
        "The problem was analyzed by examining the activities involved in handling digital evidence from ingestion to retrieval. The analysis showed that evidence management involves several independent concerns: proving integrity, protecting confidentiality, controlling access, recording accountability and enabling efficient search."
    )
    add_p(
        "A major technical challenge was designing the encryption approach. Encrypting every file directly with a single master key would make key rotation difficult and increase the impact of a key leak. Envelope encryption, in which each file uses its own Data Encryption Key (DEK) that is itself protected by a Master Key, was selected to address this. Another challenge was ensuring that the audit trail could not be bypassed. The audit logger was implemented so that it records user ID, IP address, device user-agent, action and timestamp automatically for every relevant request."
    )

    add_p("CO Alignment: CO2 – Analyze and design solutions to complex business problems.", bold=True, space_before=6, space_after=12)

    # 4. SOLUTION DESIGN AND METHODOLOGY
    add_sec_title("4. SOLUTION DESIGN AND METHODOLOGY")
    add_subsec_title("4.1 Proposed Solution")
    add_p(
        "CivicEvidence is a secure web-based Digital Evidence Management System that combines applied cryptography, role-based access control and AI-assisted search. The system consists of a React frontend, an Express.js backend, a MongoDB database and a cryptography and audit layer. The proposed solution provides SHA-256 checksums, AES-256 envelope encryption, an ISO 27037 audit logger, 4-tier RBAC, 2FA OTP verification, and a smart AI forensic assistant."
    )

    add_subsec_title("4.2 System Architecture / Workflow")
    add_p(
        "The overall architecture consists of the browser-based client, the React frontend, the Express.js REST API with its security middleware, and the supporting services for cryptography, auditing, email and AI. Figure 4.2.1 illustrates the interaction between these major system components."
    )

    p_fig421 = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=4)
    fig421_path = os.path.join(images_dir, "DOC-2026_image2.jpeg")
    if os.path.exists(fig421_path):
        p_fig421.add_run().add_picture(fig421_path, width=Inches(5.4))
    add_p("Figure 4.2.1 – Architecture Diagram of the CivicEvidence DEMS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=10, bold=True, font_size=11)

    add_subsec_title("4.3 Module / Component Design")
    add_p(
        "Table IV presents the major modules of the proposed system, along with their purpose, inputs, processing activities, and outputs."
    )

    add_table_title("TABLE IV: MODULE / COMPONENT DESIGN OF THE PROPOSED SYSTEM")
    t4_headers = ["Module", "Purpose", "Inputs", "Processing", "Outputs"]
    t4_data = [
        ["Authentication Module", "Secure user access and 2FA OTP verification.", "Login credentials, OTP codes", "bcrypt hashing, JWT generation, OTP verification.", "JWT token, auth state"],
        ["Cryptographic Engine", "File encryption and hash checking.", "Raw evidence file binary", "SHA-256 hash calculation, AES-256-GCM encryption.", "Encrypted blob, DEK/IV, hash"],
        ["Audit Logger Module", "Chain of Custody recording.", "User request context", "Extracts IP, user-agent, action, target.", "Immutable audit record"],
        ["AI Assistant Module", "Conversational search and statistics.", "Natural language prompt", "Live MongoDB regex query / Gemini API call.", "Markdown response, live stats"],
        ["Role Clearance Guard", "Enforce 4-tier RBAC access.", "User token and role", "Validates role against route policy.", "Access granted / 403 Forbidden"]
    ]
    t4 = doc.add_table(rows=len(t4_data) + 1, cols=5)
    format_clean_table(t4, [1.3, 1.4, 1.2, 1.4, 1.2], t4_headers, t4_data)

    p_fig431 = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=4)
    fig431_path = os.path.join(images_dir, "DOC-2026_image3.jpeg")
    if os.path.exists(fig431_path):
        p_fig431.add_run().add_picture(fig431_path, width=Inches(5.2))
    add_p("Figure 4.3.1 – Envelope Encryption and Integrity Verification Flow", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=10, bold=True, font_size=11)

    add_subsec_title("4.4 Design Decisions and Justification")
    add_bullet("MERN Stack: Allows JavaScript to be used in frontend, backend, and database layers, keeping data structures uniform with JSON.")
    add_bullet("Node.js Native Crypto Module: Used instead of third-party cryptography packages to eliminate external dependencies and rely on battle-tested OpenSSL primitives.")
    add_bullet("Envelope Encryption: Generates unique DEKs for each evidence asset, limiting key compromise impact and enabling efficient key lifecycle management.")
    add_bullet("JWT with Refresh Token Rotation: Prevents replay and session hijacking by issuing short-lived access tokens and single-use refresh tokens.")
    add_bullet("Live Regex Search with Optional LLM: Provides sub-second query response from MongoDB records while allowing Gemini API fallback for legal inquiries.")
    add_bullet("Glassmorphic Dark-Mode Interface: Enhances readability in professional forensic environments while reducing visual fatigue.")

    add_subsec_title("4.5 Methodology")
    add_p("The project followed a systematic development lifecycle across 7 structured phases:")
    add_bullet("Phase 1 – Requirement Identification: Defined digital evidence handling challenges, ISO 27037 compliance boundaries, and user roles.")
    add_bullet("Phase 2 – System Design: Structured MongoDB database schemas (User, Evidence, Case, AuditLog), REST endpoints, and crypto workflows.")
    add_bullet("Phase 3 – Module Development: Built controllers, crypto services, audit loggers, Nodemailer services, and React dashboard components.")
    add_bullet("Phase 4 – Integration: Connected frontend client to Express backend API, database layer, and SMTP mailing services.")
    add_bullet("Phase 5 – Testing: Executed functional, security, and integrity verification tests using cURL and Node.js test suites.")
    add_bullet("Phase 6 – Debugging and Improvement: Resolved CORS proxy routing, schema populate paths, and password reset verification flags.")
    add_bullet("Phase 7 – Final Verification: Validated the integrated system locally with backend on port 5002 and frontend on port 5174.")

    add_p("CO Alignment: CO2 – Solution analysis, design and technical justification.", bold=True, space_before=6, space_after=12)

    # 5. IMPLEMENTATION AND TECHNICAL EXECUTION
    add_sec_title("5. IMPLEMENTATION AND TECHNICAL EXECUTION")
    add_subsec_title("5.1 Development Environment")
    add_p(
        "The CivicEvidence system was developed and tested in a local development environment. The main technologies were Node.js, Express.js, "
        "MongoDB with Mongoose, React 18 with Vite, the Node.js crypto module, JWT, bcryptjs, Nodemailer and the Google Gemini API. "
        "cURL and Node.js scripts were used for API testing. The backend server runs on port 5002 and the frontend development server runs on port 5174."
    )

    add_subsec_title("5.2 Implementation Details")
    add_bullet("Server Entry Point: Configured Express server with Helmet HTTP security headers, CORS controls, and express-rate-limit brute force limiters.")
    add_bullet("Authentication and 2FA OTP: Implemented registration, login, bcrypt password hashing, JWT rotation, and Nodemailer 6-digit email OTP verification.")
    add_bullet("Email Service: Established central SMTP transporter using Gmail with an application-specific password to dispatch OTP codes.")
    add_bullet("Cryptographic Engine: Computed SHA-256 hashes upon ingestion, generated AES-256-GCM DEK/IV, wrapped keys with the Master Key, and verified hashes on download.")
    add_bullet("Audit Logger: Automatically extracted user ID, IP address, user-agent, action and timestamp to persist immutable ISO 27037 logs.")
    add_bullet("RBAC Middleware: Enforced clearance levels (Admin, Officer, Investigator, User) before controller action execution.")
    add_bullet("AI Assistant Engine: Processed natural-language user queries with MongoDB regex search and Gemini LLM integration.")
    add_bullet("Frontend Dashboard: Constructed glassmorphic single-page interface using React 18, Vite, React Router v6, and custom CSS tokens.")

    add_subsec_title("5.3 Individual Contribution")
    add_p(
        "Table V presents the major development, implementation, testing, and documentation activities carried out during the internship."
    )

    add_table_title("TABLE V: INDIVIDUAL CONTRIBUTION TO THE INTERNSHIP PROJECT")
    t5_headers = ["Task / Module", "My Contribution", "Tools / Technologies", "Evidence / Output File"]
    t5_data = [
        ["Server Entry Point", "Configured Express server, Helmet, CORS and rate limiters.", "Node.js, Express, Helmet", "backend/server.js"],
        ["Auth and 2FA OTP", "Implemented login, registration, password regex and OTP verification.", "bcryptjs, JWT, Nodemailer", "backend/controllers/authController.js"],
        ["Email Service", "Configured central Gmail SMTP transporter.", "Nodemailer, Gmail SMTP", "backend/services/emailService.js"],
        ["Crypto Engine", "Implemented SHA-256 checksums and AES-256-GCM envelope encryption.", "Node.js native crypto", "backend/controllers/evidenceController.js"],
        ["Audit Logger", "Built automated ISO 27037 compliant Chain of Custody tracking.", "MongoDB, Express middleware", "backend/utils/auditLogger.js"],
        ["AI Assistant Engine", "Engineered live MongoDB regex search and Gemini LLM fallback.", "Node.js, Express, Gemini API", "backend/controllers/aiController.js"],
        ["AI Assistant UI", "Designed floating glassmorphic chat widget.", "React 18, Vite, CSS", "frontend/src/components/common/AiChatAssistant.jsx"],
        ["Testing & Verification", "Conducted functional, cryptographic integrity, and API test suites.", "cURL, Node.js test scripts", "backend/test-backend.js"]
    ]
    t5 = doc.add_table(rows=len(t5_data) + 1, cols=4)
    format_clean_table(t5, [1.3, 2.1, 1.6, 1.5], t5_headers, t5_data)

    add_subsec_title("5.4 Integration and Collaboration")
    add_p(
        "The components were integrated to form a single working system. The React dashboard acts as the user interface, the Express API processes "
        "requests, the cryptographic engine and audit logger protect and record evidence handling, MongoDB stores metadata and logs, and Nodemailer "
        "and the Gemini API provide external services. Weekly meetings with the mentor ensured ongoing alignment with project goals."
    )

    add_p("CO Alignment: CO3 – Build and deploy solutions for the target platform.", bold=True, space_before=6, space_after=12)

    # 6. TESTING, RESULTS AND DEPLOYMENT
    add_sec_title("6. TESTING, RESULTS AND DEPLOYMENT")
    add_subsec_title("6.1 Testing Strategy")
    add_p(
        "Functional and integration testing covered registration validation, evidence upload and envelope encryption, download with integrity "
        "verification, AI assistant regex search, and 2FA OTP password reset. As shown in Table VI, all test cases executed successfully with a Pass status."
    )

    add_table_title("TABLE VI: FUNCTIONAL AND INTEGRATION TEST CASES")
    t6_headers = ["Test Case ID", "Input / Scenario", "Expected Result", "Actual Result", "Status"]
    t6_data = [
        ["TC01", "User registration with weak password.", "Reject with password complexity alert.", "Alert displayed (8+ characters, upper, lower, symbol required).", "Pass"],
        ["TC02", "Upload evidence file (image/video/doc).", "Calculate SHA-256 hash and AES-256 encrypt blob.", "Hash stored in DB, encrypted file saved in backend/uploads/.", "Pass"],
        ["TC03", "Download evidence file.", "Recompute SHA-256 hash and decrypt blob.", "Hash verified as matching; file decrypted cleanly.", "Pass"],
        ["TC04", "AI assistant query (“bank robbery files”).", "Perform live MongoDB regex search.", "Returns matching titles, filenames and SHA-256 hashes.", "Pass"],
        ["TC05", "Password reset via 2FA OTP.", "Verify 6-digit OTP and set isEmailVerified=true.", "Password updated, email verified, login succeeds without warning.", "Pass"]
    ]
    t6 = doc.add_table(rows=len(t6_data) + 1, cols=5)
    format_clean_table(t6, [0.8, 1.8, 1.6, 1.7, 0.6], t6_headers, t6_data)

    add_subsec_title("6.2 Results and Performance")
    add_p(
        "The system successfully encrypted and stored evidence, verified integrity on retrieval, recorded audit entries and returned AI search results "
        "quickly from the database. Weak passwords were rejected, OTP-based password reset worked and role-based access restricted protected routes. "
        "Testing also helped resolve issues related to proxy CORS errors, Mongoose populate errors, and frontend icon import crashes."
    )

    add_subsec_title("6.3 Deployment")
    add_p(
        "The system was deployed and tested in a local environment. The backend server runs on port 5002 and the frontend runs on port 5174. "
        "Encrypted evidence files are stored in backend/uploads/, metadata is stored in MongoDB and OTP emails are sent through the configured Gmail SMTP service."
    )

    add_subsec_title("6.4 Limitations")
    add_bullet("The current deployment is intended primarily for testing and demonstration in a local development environment.")
    add_bullet("Evidence files are stored on local server disk rather than on cloud object storage (e.g., AWS S3 or Google Cloud Storage).")
    add_bullet("The Master Key is managed by server environment configuration rather than by a dedicated hardware security module (HSM).")
    add_bullet("AI responses from the LLM depend on the availability of the external Gemini API connection.")
    add_bullet("Large-scale multi-gigabyte video evidence processing was outside the immediate scope of the local prototype.")

    add_subsec_title("6.5 Future Enhancements")
    add_bullet("Cloud deployment with managed cloud object storage (S3/GCS) and AWS KMS for centralized Master Key lifecycle management.")
    add_bullet("Multi-factor authentication options beyond email OTP, such as TOTP authenticator apps and FIDO2 hardware keys.")
    add_bullet("Digital signatures and blockchain timestamping for mathematically proven legal non-repudiation.")
    add_bullet("Advanced analytics and reporting dashboards with interactive case timelines for courtroom presentation.")
    add_bullet("Native media streaming for encrypted video evidence playback without full file download.")

    add_p("CO Alignment: CO3 – Build, test and deploy solutions.", bold=True, space_before=6, space_after=12)

    # 7. INDUSTRY / PROFESSIONAL LEARNING
    add_sec_title("7. INDUSTRY / PROFESSIONAL LEARNING")
    add_subsec_title("7.1 Technical Skills Acquired")
    add_p(
        "During the internship, I gained hands-on proficiency in applied cryptography (AES-256, SHA-256), Node.js native crypto APIs, JWT authentication, "
        "MERN full-stack development, Express rate limiting, Nodemailer email services and Google Gemini API integration. Practical exposure was also gained "
        "in role-based access control, audit logging, and defensive software design."
    )

    add_subsec_title("7.2 Problem-Solving and Decision-Making")
    add_p("During development and testing, several technical challenges were identified and systematically resolved:")
    add_bullet("Proxy CORS Errors: Analyzed CORS origin headers and Vite proxy configurations to enable seamless frontend-backend communication.")
    add_bullet("Mongoose Populate Errors: Corrected multi-model references across Case, User, and Evidence schemas to ensure consistent API payloads.")
    add_bullet("Vite React Icon Import Crashes: Identified incorrect named icon exports and standardized Lucide/Feather icon component trees.")
    add_bullet("Email Verification Flag: Automated the synchronization of the isEmailVerified flag upon successful 2FA OTP password reset.")

    add_subsec_title("7.3 Teamwork and Professional Practices")
    add_p(
        "The project was carried out under mentor guidance with regular discussions on progress, technical challenges and implementation decisions. "
        "Industrial software engineering workflows such as Git version control, modular code separation, and threat modeling were followed, "
        "and feedback was used to improve the system."
    )

    add_subsec_title("7.4 Industry Insights")
    add_p(
        "The internship provided an understanding of the difference between academic learning and practical software development. "
        "Real-world projects, especially in security, require careful threat modeling, continuous testing, documentation and iterative improvement. "
        "Security cannot be added at the end; it must be designed into the architecture from the beginning."
    )

    # 8. INTERNSHIP ACTIVITY LOG
    add_sec_title("8. INTERNSHIP ACTIVITY LOG")
    add_p(
        "The internship activities were carried out progressively over a period of four weeks, covering project understanding, system design, "
        "cryptographic implementation, testing, and final documentation. The weekly activities, technical learning, challenges encountered, "
        "and outcomes are summarized in Table VII."
    )

    add_table_title("TABLE VII: FOUR-WEEK INTERNSHIP ACTIVITY LOG")
    t7_headers = ["Week / Date", "Activity / Task", "Technical Learning", "Outcome / Evidence"]
    t7_data = [
        ["Week 1", "Requirement analysis, architecture design and database schema setup.", "MongoDB Mongoose schemas (User, Evidence, Case, AuditLog).", "Database models and REST routing scaffolded."],
        ["Week 2", "Backend API implementation, JWT authentication and Nodemailer 2FA OTP mailer.", "Node.js, Express, Nodemailer SMTP transport.", "Auth controller and email verification active."],
        ["Week 3", "Applied cryptography engine (AES-256 / SHA-256) and audit logger.", "Node.js crypto module, ISO 27037 audit tracking.", "Evidence upload/download and audit logs working."],
        ["Week 4", "AI assistant integration, Vite React dashboard and final testing.", "React 18, Vite, regex search, Gemini API.", "Fully functional CivicEvidence DEMS platform."]
    ]
    t7 = doc.add_table(rows=len(t7_data) + 1, cols=4)
    format_clean_table(t7, [0.9, 2.3, 2.0, 1.3], t7_headers, t7_data)

    # 9. EVIDENCE OF INTERNSHIP WORK
    add_sec_title("9. EVIDENCE OF INTERNSHIP WORK")
    add_p(
        "The following evidence represents the major stages of the internship project, covering the complete development process from system design "
        "and architecture to implementation, testing, performance evaluation, and API integration. These figures provide visual support for the technical "
        "activities carried out during the internship and demonstrate the practical application of the concepts and technologies learned."
    )

    # Evidence Mapping Table
    add_table_title("TABLE VIII: EVIDENCE OF INTERNSHIP WORK AND COURSE OUTCOME MAPPING")
    t_ev_headers = ["Evidence No.", "Image to Include", "Related CO", "What it Demonstrates"]
    t_ev_data = [
        ["Fig. 9.1.1", "Project Environment & Workspace", "CO1", "Project file structure, backend controllers, models, and dependencies."],
        ["Fig. 9.1.2", "Backend & Frontend Servers Running", "CO1, CO3", "Local server execution on port 5002 and Vite dev server on port 5174."],
        ["Fig. 9.2", "System Architecture / Workflow Diagram", "CO2", "Interaction between browser, React client, Express API, MongoDB, and crypto engine."],
        ["Fig. 9.3.1", "Secure Login & Authentication UI", "CO3", "Role-based authentication interface with interactive password visibility."],
        ["Fig. 9.3.2", "System Administration Dashboard", "CO3", "Real-time evidence metrics, active cases, upload trends, and storage statistics."],
        ["Fig. 9.4.1", "Chain of Custody Audit Log", "CO3, CO4", "Immutable forensic audit trail recording timestamp, investigator, IP, and status."],
        ["Fig. 9.4.2", "AI Forensic Assistant Interface", "CO1, CO3", "Live MongoDB regex evidence retrieval and forensic compliance assistance."]
    ]
    t_ev = doc.add_table(rows=len(t_ev_data) + 1, cols=4)
    format_clean_table(t_ev, [1.0, 2.0, 0.9, 2.6], t_ev_headers, t_ev_data)

    # Paired Figures for Clean Balanced Page Filling:
    # Fig 9.1.1 & 9.1.2
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image4.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8))
    add_p("Figure 9.1.1 – The Project Environment (VS Code Structure & Source Files)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image6.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8))
    add_p("Figure 9.1.2 – The Backend (Port 5002) and Frontend (Port 5174) Servers Running", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)
    add_p("Description: Development environment showing project file structure and live execution of backend Express server and Vite React frontend.", space_after=8)

    # Fig 9.2 & Fig 9.3.1
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image2.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8))
    add_p("Figure 9.2 – Architecture Diagram of the CivicEvidence DEMS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image7.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(2.6))
    add_p("Figure 9.3.1 – Login Interface with Role Authentication", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)
    add_p("Description: Layered system architecture depicting client-server integration, and secure login portal featuring interactive eye toggles for password verification.", space_after=8)

    # Fig 9.3.2 & Fig 9.4.1
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image8.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8))
    add_p("Figure 9.3.2 – Evidence Dashboard with Forensic Statistics and Activity Feed", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image9.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8))
    add_p("Figure 9.4.1 – Chain of Custody Cryptographic Audit Log Table", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=3, bold=True, font_size=10.5)
    add_p("Description: Web dashboard displaying live evidence metrics, active case counters, and immutable audit logs capturing timestamps, investigator identities, and IP addresses.", space_after=8)

    # Fig 9.4.2 & Section 10 Intro
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image10.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.2))
    add_p("Figure 9.4.2 – AI Forensic Assistant Answering Case and Compliance Queries", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=4, bold=True, font_size=10.5)
    add_p("Description: Conversational AI interface retrieving matching evidence records with SHA-256 hashes and assisting investigators with ISO 27037 compliance guidelines.", space_after=10)

    # 10. COURSE OUTCOME ATTAINMENT EVIDENCE
    add_sec_title("10. COURSE OUTCOME ATTAINMENT EVIDENCE")
    add_p(
        "The internship activities and project outcomes provided practical evidence for the attainment of the specified course outcomes. "
        "The work covered industry practices and technologies, problem identification and solution design, software implementation and deployment, "
        "testing and performance evaluation, and technical documentation and presentation. The evidence collected throughout the internship, "
        "including system architecture, implementation outputs, performance results, and project activities, was mapped to the respective course outcomes."
    )

    add_table_title("TABLE IX: COURSE OUTCOME ATTAINMENT AND SUPPORTING EVIDENCE")
    t_co_headers = ["CO", "Course Outcome", "Evidence / Activities", "Artifact / Section Reference"]
    t_co_data = [
        ["CO1", "Industry Practices, Processes, Techniques, Technology, Automation, and other core aspects of the software industry.", "Gained practical exposure to MERN development, applied cryptography, version control, documentation, testing, and mentor reviews.", "Section 1.3, Section 1.4, Section 1.5, Fig. 9.1.1, Fig. 9.1.2"],
        ["CO2", "Analyze and design solutions to complex business problems.", "Analyzed vulnerabilities of traditional file storage and designed envelope encryption, 4-tier RBAC, and ISO 27037 audit architecture.", "Sections 3.1–3.5, 4.1–4.5, Fig. 4.2.1, Fig. 9.2"],
        ["CO3", "Build and deploy solutions for target platform.", "Implemented MERN platform, crypto engine, Nodemailer 2FA OTP service, audit logger, and verified local deployment on ports 5002/5174.", "Sections 5.1–5.5, 6.1–6.3, Fig. 9.3.1, Fig. 9.3.2, Fig. 9.4.1"],
        ["CO4", "Preparation of Technical Reports and Presentations.", "Authored technical documentation, activity logs, test reports, weekly progress reviews, and final internship presentation.", "Section 7, Section 8, Section 9, Table VI, Table VII"]
    ]
    t_co = doc.add_table(rows=len(t_co_data) + 1, cols=4)
    format_clean_table(t_co, [0.6, 2.3, 2.4, 1.2], t_co_headers, t_co_data)

    add_p(
        "The evidence demonstrates that the internship provided practical opportunities to apply academic knowledge in a real software development "
        "environment. It reflects the development of technical, analytical, problem-solving, implementation, testing, deployment, and professional communication skills.",
        space_before=6, space_after=10
    )

    # Clean Page Break so Section 11 & 12 occupy their own fully filled page!
    doc.add_page_break()

    # 11. CONCLUSION & 12. REFERENCES (Cleanly on same page, fully filled down to footer!)
    add_sec_title("11. CONCLUSION")
    add_p(
        "The four-week internship at CLOUDSTRAND PRIVATE LIMITED, Chennai provided valuable technical and industry exposure in software engineering "
        "and cybersecurity. The internship helped in understanding how academic concepts can be applied to real-world security requirements."
    )
    add_p(
        "The developed project, CivicEvidence DEMS, addresses the vulnerabilities of traditional evidence storage by combining SHA-256 integrity "
        "verification, AES-256-GCM envelope encryption, an ISO 27037 aligned Chain of Custody audit trail, role-based access control, two-factor email OTP "
        "and an AI-based forensic search assistant. The project provided practical experience in requirement analysis, system design, implementation, "
        "integration, testing, debugging and local deployment."
    )
    add_p(
        "The internship strengthened skills in full-stack web development, applied cryptography, secure API design, database handling and documentation. "
        "Working through implementation issues improved problem-solving and debugging abilities, and the overall experience provided a better understanding "
        "of systematic and secure software development practices."
    )
    add_p(
        "Overall, the internship provided practical experience in analyzing a real technical problem, designing and implementing a solution, testing its performance, "
        "and documenting the results. The activities and outputs throughout the internship provided evidence for the attainment of CO1 through CO4, covering industry exposure, "
        "problem analysis and solution design, implementation and deployment, and technical documentation and presentation."
    )

    add_sec_title("12. REFERENCES / RESOURCES")
    refs = [
        "[1] ISO/IEC 27037:2012 – Guidelines for identification, collection, acquisition and preservation of digital evidence.",
        "[2] NIST SP 800-86 – Guide to Integrating Forensic Techniques into Incident Response.",
        "[3] Node.js Crypto Documentation – https://nodejs.org/api/crypto.html",
        "[4] React 18 and Vite Documentation – https://vitejs.dev/",
        "[5] Google Gemini API Documentation – https://ai.google.dev/",
        "[6] MongoDB and Mongoose Documentation – database design, schemas and queries.",
        "[7] Express.js, Helmet, express-rate-limit and Nodemailer Documentation – middleware, API security and email transport.",
        "[8] RFC 7519 – JSON Web Token (JWT).",
        "[9] NIST FIPS 197 (AES), FIPS 180-4 (SHA-256) and SP 800-38D (GCM mode) – cryptographic standards.",
        "[10] OWASP Top 10 API Security Risks – API security, rate limiting, and broken object level authorization."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.space_before = Pt(1.5)
        p_ref.paragraph_format.space_after = Pt(2.5)
        p_ref.paragraph_format.line_spacing = 1.15
        r_run = p_ref.add_run(r)
        r_run.font.name = 'Times New Roman'
        r_run.font.size = Pt(10.5)

    # =========================================================================
    # APPENDIX A: SELECTED CODE / TECHNICAL ARTIFACTS (EXACTLY 3 PAGES LIKE PDF 1)
    # =========================================================================
    print("Building Appendix A: Clean Monospaced Code across 3 Full Pages...")
    doc.add_page_break()
    add_p("APPENDIX A – EVIDENCE_CONTROLLER.JS", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=4, bold=True, font_size=13)
    add_p(
        "This controller module implements core evidence management operations including evidence listing with search and pagination, "
        "file upload with AES-256-GCM envelope encryption, secure file download with SHA-256 integrity verification, versioning, soft delete, and rollback. "
        "Every state change and data access is automatically tracked by the ISO 27037 audit logger.",
        space_after=8, font_size=10.5
    )

    def add_code_line(text):
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
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_CODE_DARK
        else:
            r = p.add_run(" ")
            r.font.name = 'Consolas'
            r.font.size = Pt(4.0)

    # Complete, fully populated code lines from evidenceController.js
    code_lines = [
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
        "    evidenceId,",
        "    sharedWith: user._id,",
        "    expiresAt: { $gt: new Date() },",
        "  });",
        "  if (!activePermission) return false;",
        "  if (requiredPermission === 'download') {",
        "    return activePermission.permission === 'download' || activePermission.permission === 'edit_metadata';",
        "  }",
        "  return true;",
        "};",
        "",
        "const getEvidenceList = async (req, res) => {",
        "  try {",
        "    const { search, caseId, category, fileType, tag, sort, page = 1, limit = 10, includeDeleted = 'false' } = req.query;",
        "    const query = {};",
        "    if (includeDeleted === 'true' && req.user.role === 'admin') {",
        "      query.isDeleted = true;",
        "    } else {",
        "      query.isDeleted = false;",
        "    }",
        "    if (req.user.role === 'user') {",
        "      const sharedPermissions = await Permission.find({",
        "        sharedWith: req.user._id,",
        "        expiresAt: { $gt: new Date() },",
        "      }).select('evidenceId');",
        "      const sharedIds = sharedPermissions.map((p) => p.evidenceId);",
        "      query.$or = [{ uploadedBy: req.user._id }, { _id: { $in: sharedIds } }];",
        "    }",
        "    if (search) {",
        "      query.$and = query.$and || [];",
        "      query.$and.push({",
        "        $or: [",
        "          { title: { $regex: search, $options: 'i' } },",
        "          { description: { $regex: search, $options: 'i' } },",
        "          { originalFilename: { $regex: search, $options: 'i' } },",
        "        ],",
        "      });",
        "    }",
        "    if (caseId) query.caseId = caseId;",
        "    if (category) query.category = category;",
        "    if (fileType) query.fileType = { $regex: fileType, $options: 'i' };",
        "    if (tag) query.tags = tag;",
        "    let sortObj = { createdAt: -1 };",
        "    if (sort === 'oldest') sortObj = { createdAt: 1 };",
        "    else if (sort === 'name') sortObj = { title: 1 };",
        "    else if (sort === 'size') sortObj = { fileSize: -1 };",
        "    const skip = (page - 1) * limit;",
        "    const total = await Evidence.countDocuments(query);",
        "    const evidence = await Evidence.find(query)",
        "      .populate('uploadedBy', 'name email role')",
        "      .populate('caseId', 'caseNumber title')",
        "      .sort(sortObj)",
        "      .skip(skip)",
        "      .limit(Number(limit));",
        "    res.json({ evidence, page: Number(page), pages: Math.ceil(total / limit), total });",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
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
        "    const hasAccess = await checkUserAccess(req.user, evidence._id, 'read');",
        "    if (!hasAccess) {",
        "      await logAudit(req, {",
        "        action: 'VIEW_DENIED',",
        "        target: evidence._id.toString(),",
        "        details: 'Attempted to view evidence without permission',",
        "        status: 'failure',",
        "      });",
        "      return res.status(403).json({ message: 'Access denied: You do not have permissions to view this evidence.' });",
        "    }",
        "    const versions = await EvidenceVersion.find({ evidenceId: evidence._id })",
        "      .populate('updatedBy', 'name email role')",
        "      .sort({ version: -1 });",
        "    await logAudit(req, {",
        "      action: 'VIEW',",
        "      target: evidence._id.toString(),",
        "      details: `Viewed metadata of: \"${evidence.title}\"`,",
        "    });",
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
        "      title,",
        "      description,",
        "      caseId: caseId || undefined,",
        "      uploadedBy: req.user._id,",
        "      encryptedFileURL,",
        "      originalFilename: req.file.originalname,",
        "      fileType: req.file.mimetype,",
        "      fileSize: req.file.size,",
        "      hash,",
        "      tags: parsedTags,",
        "      category: category || 'General',",
        "      fileKeyEncrypted,",
        "      fileIvHex,",
        "    });",
        "    await logAudit(req, {",
        "      action: 'UPLOAD',",
        "      target: evidence._id.toString(),",
        "      details: `Uploaded evidence \"${title}\" (${req.file.originalname}). Hash: ${hash}`,",
        "    });",
        "    res.status(201).json(evidence);",
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
        "    if (!hasAccess) {",
        "      await logAudit(req, {",
        "        action: 'DOWNLOAD_DENIED',",
        "        target: evidence._id.toString(),",
        "        details: 'Attempted to download evidence without permission',",
        "        status: 'failure',",
        "      });",
        "      return res.status(403).json({ message: 'Access denied: You do not have permissions.' });",
        "    }",
        "    const encryptedBuffer = await storageService.downloadFile(evidence.encryptedFileURL);",
        "    const decryptedBuffer = encryptionService.decryptFile(encryptedBuffer, evidence.fileKeyEncrypted, evidence.fileIvHex);",
        "    const decryptedHash = encryptionService.calculateHash(decryptedBuffer);",
        "    if (decryptedHash !== evidence.hash) {",
        "      await logAudit(req, {",
        "        action: 'INTEGRITY_FAIL',",
        "        target: evidence._id.toString(),",
        "        details: 'Downloaded file hash mismatch! Integrity breached.',",
        "        status: 'failure',",
        "      });",
        "      return res.status(500).json({ message: 'File integrity check failed: Decrypted file hash mismatch.' });",
        "    }",
        "    await logAudit(req, {",
        "      action: 'DOWNLOAD',",
        "      target: evidence._id.toString(),",
        "      details: `Downloaded evidence file: \"${evidence.originalFilename}\"`,",
        "    });",
        "    res.setHeader('Content-Disposition', `attachment; filename=\"${evidence.originalFilename}\"`);",
        "    res.setHeader('Content-Type', evidence.fileType);",
        "    res.send(decryptedBuffer);",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const updateEvidence = async (req, res) => {",
        "  try {",
        "    const evidence = await Evidence.findById(req.params.id);",
        "    if (!evidence || evidence.isDeleted) return res.status(404).json({ message: 'Evidence not found.' });",
        "    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();",
        "    const canEdit = isOwner || req.user.role === 'admin' || req.user.role === 'officer';",
        "    if (!canEdit) return res.status(403).json({ message: 'Access denied: You are not authorized.' });",
        "    const { title, description, caseId, tags, category, changeNotes } = req.body;",
        "    if (caseId && caseId !== (evidence.caseId ? evidence.caseId.toString() : '')) {",
        "      const parentCase = await Case.findById(caseId);",
        "      if (!parentCase) return res.status(404).json({ message: 'Assigned case not found.' });",
        "      evidence.caseId = caseId;",
        "    }",
        "    if (title) evidence.title = title;",
        "    if (description !== undefined) evidence.description = description;",
        "    if (category) evidence.category = category;",
        "    if (tags) evidence.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());",
        "    if (req.file) {",
        "      const currentVersionCount = await EvidenceVersion.countDocuments({ evidenceId: evidence._id });",
        "      const nextVersionNumber = currentVersionCount + 1;",
        "      await EvidenceVersion.create({",
        "        evidenceId: evidence._id,",
        "        version: nextVersionNumber,",
        "        updatedBy: req.user._id,",
        "        changes: changeNotes || 'New file uploaded',",
        "        encryptedFileURL: evidence.encryptedFileURL,",
        "        fileSize: evidence.fileSize,",
        "        hash: evidence.hash,",
        "        fileKeyEncrypted: evidence.fileKeyEncrypted,",
        "        fileIvHex: evidence.fileIvHex,",
        "      });",
        "      const { encryptedBuffer, fileKeyEncrypted, fileIvHex, hash } = encryptionService.encryptFile(req.file.buffer);",
        "      const newFileURL = await storageService.uploadFile(encryptedBuffer, req.file.originalname);",
        "      evidence.encryptedFileURL = newFileURL;",
        "      evidence.originalFilename = req.file.originalname;",
        "      evidence.fileType = req.file.mimetype;",
        "      evidence.fileSize = req.file.size;",
        "      evidence.hash = hash;",
        "      evidence.fileKeyEncrypted = fileKeyEncrypted;",
        "      evidence.fileIvHex = fileIvHex;",
        "      await logAudit(req, {",
        "        action: 'VERSION_UPDATE',",
        "        target: evidence._id.toString(),",
        "        details: `Uploaded new version (v${nextVersionNumber + 1}). Hash: ${hash}`,",
        "      });",
        "    } else {",
        "      await logAudit(req, {",
        "        action: 'METADATA_UPDATE',",
        "        target: evidence._id.toString(),",
        "        details: `Updated metadata for \"${evidence.title}\"`,",
        "      });",
        "    }",
        "    await evidence.save();",
        "    res.json(evidence);",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const deleteEvidence = async (req, res) => {",
        "  try {",
        "    const evidence = await Evidence.findById(req.params.id);",
        "    if (!evidence || evidence.isDeleted) return res.status(404).json({ message: 'Evidence not found.' });",
        "    const isOwner = evidence.uploadedBy.toString() === req.user._id.toString();",
        "    const canDelete = isOwner || req.user.role === 'admin';",
        "    if (!canDelete) return res.status(403).json({ message: 'Access denied: You are not authorized.' });",
        "    evidence.isDeleted = true;",
        "    await evidence.save();",
        "    await logAudit(req, {",
        "      action: 'DELETE',",
        "      target: evidence._id.toString(),",
        "      details: `Soft-deleted evidence \"${evidence.title}\"`,",
        "    });",
        "    res.json({ message: 'Evidence soft-deleted successfully.' });",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const restoreEvidence = async (req, res) => {",
        "  try {",
        "    const evidence = await Evidence.findById(req.params.id);",
        "    if (!evidence || !evidence.isDeleted) return res.status(404).json({ message: 'Evidence not found or not deleted.' });",
        "    evidence.isDeleted = false;",
        "    await evidence.save();",
        "    await logAudit(req, {",
        "      action: 'RESTORE',",
        "      target: evidence._id.toString(),",
        "      details: `Restored soft-deleted evidence \"${evidence.title}\"`,",
        "    });",
        "    res.json({ message: 'Evidence restored successfully.' });",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "const rollbackEvidenceVersion = async (req, res) => {",
        "  try {",
        "    const { versionId } = req.body;",
        "    if (!versionId) return res.status(400).json({ message: 'Version ID is required for rollback.' });",
        "    const evidence = await Evidence.findById(req.params.id);",
        "    if (!evidence || evidence.isDeleted) return res.status(404).json({ message: 'Evidence not found.' });",
        "    const targetVersion = await EvidenceVersion.findOne({ _id: versionId, evidenceId: evidence._id });",
        "    if (!targetVersion) return res.status(404).json({ message: 'Version record not found.' });",
        "    const currentVersionCount = await EvidenceVersion.countDocuments({ evidenceId: evidence._id });",
        "    const nextVersionNumber = currentVersionCount + 1;",
        "    await EvidenceVersion.create({",
        "      evidenceId: evidence._id,",
        "      version: nextVersionNumber,",
        "      updatedBy: req.user._id,",
        "      changes: `Rollback to version ${targetVersion.version}`,",
        "      encryptedFileURL: evidence.encryptedFileURL,",
        "      fileSize: evidence.fileSize,",
        "      hash: evidence.hash,",
        "      fileKeyEncrypted: evidence.fileKeyEncrypted,",
        "      fileIvHex: evidence.fileIvHex,",
        "    });",
        "    evidence.encryptedFileURL = targetVersion.encryptedFileURL;",
        "    evidence.fileSize = targetVersion.fileSize;",
        "    evidence.hash = targetVersion.hash;",
        "    evidence.fileKeyEncrypted = targetVersion.fileKeyEncrypted;",
        "    evidence.fileIvHex = targetVersion.fileIvHex;",
        "    await evidence.save();",
        "    await logAudit(req, {",
        "      action: 'ROLLBACK',",
        "      target: evidence._id.toString(),",
        "      details: `Rolled back to version ${targetVersion.version}. New snapshot (v${nextVersionNumber}) captured.`,",
        "    });",
        "    res.json({ message: `Successfully rolled back to version ${targetVersion.version}.`, evidence });",
        "  } catch (error) {",
        "    res.status(500).json({ message: error.message });",
        "  }",
        "};",
        "",
        "module.exports = {",
        "  getEvidenceList,",
        "  getEvidenceById,",
        "  uploadEvidence,",
        "  downloadEvidence,",
        "  updateEvidence,",
        "  deleteEvidence,",
        "  restoreEvidence,",
        "  rollbackEvidenceVersion,",
        "};"
    ]

    for line in code_lines:
        add_code_line(line)

    add_p("Deployment URL: http://localhost:5002 (Backend API) | http://localhost:5174 (Web Dashboard)", bold=True, space_before=8, space_after=4, font_size=10)
    add_p(
        "This controller forms the core operational foundation of the CivicEvidence DEMS platform. By decoupling cryptographic operations into specialized encryption services "
        "and enforcing immutable audit logging on every request context, it ensures strict compliance with ISO/IEC 27037 and NIST SP 800-86 standards for digital evidence admissibility.",
        font_size=10, space_after=0
    )

    # =========================================================================
    # APPENDIX B: INTERNSHIP CERTIFICATE
    # =========================================================================
    print("Building Appendix B: Certificate...")
    doc.add_page_break()
    add_p("APPENDIX B – INTERNSHIP CERTIFICATE", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=6, bold=True, font_size=13)
    p_cert = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=0)
    cert_img = os.path.join(images_dir, "DOC-2026_image11.jpeg")
    if os.path.exists(cert_img):
        p_cert.add_run().add_picture(cert_img, width=Inches(5.8), height=Inches(7.4))

    # =========================================================================
    # APPENDIX C: OFFER / JOINING LETTER
    # =========================================================================
    print("Building Appendix C: Offer Letter...")
    doc.add_page_break()
    add_p("APPENDIX C – OFFER / JOINING LETTER", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=14, bold=True, font_size=13)
    add_p("[Attach offer/joining letter if applicable.]", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=0, font_size=12)

    # =========================================================================
    # APPENDIX D: PRESENTATION EVALUATION SCORE SHEET
    # =========================================================================
    print("Building Appendix D: Score Sheet...")
    doc.add_page_break()
    add_p("APPENDIX D – INTERNSHIP PRESENTATION EVALUATION SCORE SHEET", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=14, bold=True, font_size=13)

    t_score_headers = ["S.No.", "Evaluation Criterion", "CO", "Max. Marks", "Marks Awarded"]
    t_score_data = [
        ["1", "Industry Exposure & Domain Understanding", "CO1", "20", ""],
        ["2", "Problem Identification & Analysis", "CO2", "15", ""],
        ["3", "Solution Design & Approach", "CO2", "15", ""],
        ["4", "Implementation & Technical Skills", "CO3", "15", ""],
        ["5", "Testing, Results & Deployment", "CO3", "10", ""],
        ["6", "Technical Report & Documentation", "CO4", "10", ""],
        ["7", "Presentation & Communication Skills", "CO4", "10", ""],
        ["8", "Viva / Response to Questions", "CO1–CO4", "5", ""],
        ["", "TOTAL", "", "100", ""]
    ]
    t_score = doc.add_table(rows=len(t_score_data) + 1, cols=5)
    format_clean_table(t_score, [0.6, 3.2, 0.9, 0.9, 0.9], t_score_headers, t_score_data, align_cols=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    add_p("Overall Marks: ______ / 100", bold=True, space_before=24, space_after=14)
    add_p("Evaluator Name & Signature: ______________________________      Date: __________________", bold=True, space_before=0, space_after=0)

    # Save DOCX
    docx_output_path = os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\CivicEvidence_Report_Formatted.docx")
    doc.save(docx_output_path)
    print(f"DOCX saved to: {docx_output_path}")

    return docx_output_path

if __name__ == "__main__":
    build_report()
