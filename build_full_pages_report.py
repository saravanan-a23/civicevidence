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

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, line_spacing=1.15, bold=False, font_size=12, color=COLOR_BLACK, font_name="Times New Roman", keep_with_next=False):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if keep_with_next:
            p.paragraph_format.keep_with_next = True
        if text:
            r = p.add_run(text)
            r.bold = bold
            r.font.name = font_name
            r.font.size = Pt(font_size)
            r.font.color.rgb = color
        return p

    def add_sec_title(title_text, space_before=14, space_after=6):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=space_before, space_after=space_after, bold=True, font_size=14, color=COLOR_BLACK, keep_with_next=True)

    def add_subsec_title(title_text, space_before=10, space_after=4):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=space_before, space_after=space_after, bold=True, font_size=12.5, color=COLOR_BLACK, keep_with_next=True)

    def add_subsubsec_title(title_text, space_before=6, space_after=2):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=space_before, space_after=space_after, bold=True, font_size=12, color=COLOR_BLACK, keep_with_next=True)

    def add_bullet(text, space_before=0, space_after=3, line_spacing=1.15, bold_prefix="", font_size=12):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.left_indent = Inches(0.25)
        
        r_sym = p.add_run("\u27a2 ") # Arrow symbol matching PDF 1
        r_sym.font.name = 'Times New Roman'
        r_sym.font.size = Pt(font_size)
        r_sym.font.color.rgb = COLOR_BLACK

        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Times New Roman'
            r_pre.font.size = Pt(font_size)
            r_pre.font.color.rgb = COLOR_BLACK

        r_txt = p.add_run(text)
        r_txt.font.name = 'Times New Roman'
        r_txt.font.size = Pt(font_size)
        r_txt.font.color.rgb = COLOR_BLACK
        return p

    def add_table_title(title_text, space_before=10, space_after=6):
        return add_p(title_text, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=space_before, space_after=space_after, bold=True, font_size=12, color=COLOR_BLACK, keep_with_next=True)

    def format_clean_table(table, col_widths, headers, data, align_cols=None, pad_top=90, pad_bot=90, row_font_size=10):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Header Row
        hdr_row = table.rows[0]
        # Repeat header row on continuation pages
        hdr_trPr = hdr_row._tr.get_or_add_trPr()
        hdr_trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

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
                set_cell_margins(cell, top=pad_top, bottom=pad_bot, left=140, right=140)
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
                    p.runs[0].font.size = Pt(row_font_size)
                    p.runs[0].font.name = 'Times New Roman'
                    p.runs[0].font.color.rgb = COLOR_BLACK

        # Set column widths
        for row in table.rows:
            for c_idx, w in enumerate(col_widths):
                row.cells[c_idx].width = Inches(w)

    images_dir = r"C:\Users\asara\OneDrive\Documents\cloudevidence\extracted_images"

    # =========================================================================
    # PAGE 1: COVER PAGE (BALANCED VERTICAL DISTRIBUTION, ZERO BLANK GAP)
    # =========================================================================
    print("Building Page 1: Cover Page...")
    add_p("RAMCO INSTITUTE OF TECHNOLOGY, RAJAPALAYAM", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=4, bold=True, font_size=16)
    add_p("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18, bold=True, font_size=12)

    # Centered College Crest Logo
    p_logo = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=22)
    logo_path = os.path.join(images_dir, "DOC-2026_image1.jpeg")
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(1.05), height=Inches(1.25))

    add_p("CS3711 - SUMMER INTERNSHIP", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=4, bold=True, font_size=14)
    add_p("INTERNSHIP REPORT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=32, bold=True, font_size=14)

    add_p("CIVICEVIDENCE – SECURE DIGITAL EVIDENCE MANAGEMENT SYSTEM", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=34, bold=True, font_size=16, color=COLOR_TITLE_RED)

    add_p("Submitted by", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=4, bold=False, font_size=14)
    add_p("SARAVANAN A", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, bold=True, font_size=14)
    add_p("(953623104093)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=34, bold=True, font_size=14)

    add_p("BACHELOR OF ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=4, bold=True, font_size=14)
    add_p("COMPUTER SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=34, bold=True, font_size=14)

    add_p("CLOUDSTRAND PRIVATE LIMITED", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=4, bold=True, font_size=14)
    add_p("CHENNAI", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=34, bold=True, font_size=14)

    add_p("INTERNSHIP DURATION: 23.07.2026 – 22.08.2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=10, space_after=6, bold=True, font_size=13.5)
    add_p("OCTOBER 2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0, bold=True, font_size=12)

    doc.add_page_break()

    # =========================================================================
    # PAGE 2: BONAFIDE CERTIFICATE (EXACT MATCH TO MAIN PDF)
    # =========================================================================
    print("Building Page 2: Bonafide Certificate...")
    add_p("BONAFIDE CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, font_size=14)

    add_p(
        "Certified that this Internship Report entitled “CIVICEVIDENCE – SECURE DIGITAL EVIDENCE "
        "MANAGEMENT SYSTEM with Applied Cryptography and Real-Time AI Assistant” is the "
        "bonafide work of “SARAVANAN A (953623104093)”, who carried out the Summer Internship at "
        "CLOUDSTRAND PVT LTD, Chennai, under the supervision of Mr. Pon Prabhakar",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=32, line_spacing=1.35, font_size=12
    )

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
    r1 = p_sig_l.add_run("SIGNATURE\nFACULTY IN CHARGE\n\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(12)
    r1.bold = True
    r2 = p_sig_l.add_run("Ms. Rajarajeswari P,\nAssistant Professor,\nDepartment of Computer Science and\nEngineering,\nRamco Institute of Technology,\nRajapalayam")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(12)
    r2.bold = False

    p_sig_r = c_right.paragraphs[0]
    p_sig_r.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sig_r.paragraph_format.line_spacing = 1.15
    p_sig_r.paragraph_format.space_after = Pt(0)
    r3 = p_sig_r.add_run("SIGNATURE\nHEAD OF THE DEPARTMENT\n\n")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    r3.bold = True
    r4 = p_sig_r.add_run("Dr. Vijayalakshmi K,\nProfessor/Head,\nDepartment of Computer Science and\nEngineering,\nRamco Institute of Technology,\nRajapalayam")
    r4.font.name = 'Times New Roman'
    r4.font.size = Pt(12)
    r4.bold = False

    doc.add_page_break()

    # =========================================================================
    # PAGE 3: DECLARATION (EXACT MATCH TO MAIN PDF)
    # =========================================================================
    print("Building Page 3: Declaration...")
    add_p("DECLARATION", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, font_size=14)

    add_p(
        "I hereby declare that this report presents the work carried out by me during the Summer Internship "
        "at CLOUDSTRAND PVT LTD for the specified duration and that the information presented is "
        "true to the best of my knowledge.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=36, line_spacing=1.35, font_size=12
    )

    dt_sig_table = doc.add_table(rows=1, cols=2)
    dt_sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_dt = dt_sig_table.rows[0].cells[0]
    c_sig = dt_sig_table.rows[0].cells[1]
    c_dt.width = Inches(3.25)
    c_sig.width = Inches(3.25)
    set_cell_border(c_dt, top="none", bottom="none", left="none", right="none")
    set_cell_border(c_sig, top="none", bottom="none", left="none", right="none")

    p_dt = c_dt.paragraphs[0]
    p_dt.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_dt.paragraph_format.line_spacing = 1.15
    p_dt.paragraph_format.space_after = Pt(0)
    r_dt_lbl = p_dt.add_run("Date: ")
    r_dt_lbl.bold = True
    r_dt_lbl.font.name = 'Times New Roman'
    r_dt_lbl.font.size = Pt(12)
    r_dt_line = p_dt.add_run("____________")
    r_dt_line.font.name = 'Times New Roman'
    r_dt_line.font.size = Pt(12)

    p_sig = c_sig.paragraphs[0]
    p_sig.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sig.paragraph_format.line_spacing = 1.15
    p_sig.paragraph_format.space_after = Pt(0)
    r_sig_lbl = p_sig.add_run("Signature: ")
    r_sig_lbl.bold = True
    r_sig_lbl.font.name = 'Times New Roman'
    r_sig_lbl.font.size = Pt(12)
    r_sig_line = p_sig.add_run("__________________")
    r_sig_line.font.name = 'Times New Roman'
    r_sig_line.font.size = Pt(12)

    doc.add_page_break()

    # =========================================================================
    # PAGE 4: EXECUTIVE SUMMARY (PRECISELY 100% OF PAGE 4, ZERO SPILLOVER)
    # =========================================================================
    print("Building Page 4: Executive Summary (Exact Full Page)...")
    add_p("EXECUTIVE SUMMARY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=8, bold=True, font_size=14)

    add_p(
        "The Summer Internship at CLOUDSTRAND PRIVATE LIMITED, Chennai provided comprehensive practical exposure to enterprise full-stack web application "
        "development, applied modern cryptography, defensive cloud security, role-based access control, and conversational artificial intelligence in a rigorous "
        "industry environment. As part of this internship, the project titled \u201cCivicEvidence \u2013 Secure Digital Evidence Management System (DEMS)\u201d was engineered "
        "to solve acute vulnerabilities prevalent in conventional evidence repositories: unauthorized data tampering, broken physical chains of custody, "
        "unencrypted plaintext storage, and inefficient forensic discovery across sensitive criminal investigation records.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.5, line_spacing=1.12
    )

    add_p(
        "The primary engineering objective was to architect a high-security MERN (MongoDB, Express.js, React 18, Node.js) web application delivering mathematical "
        "proof of evidentiary integrity using cryptographic SHA-256 checksums, securing evidence files at rest through AES-256-GCM envelope encryption, and "
        "generating an immutable Chain of Custody audit log compliant with ISO/IEC 27037 and NIST SP 800-86 standards. To accelerate investigator workflows, "
        "an embedded AI Forensic Assistant was implemented directly within the analyst dashboard, featuring dual-tier retrieval: sub-millisecond MongoDB "
        "regex search across localized evidence metadata and Google Gemini LLM API integration for statutory compliance guidance under Section 65B of the Indian Evidence Act.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.5, line_spacing=1.12
    )

    add_p(
        "The technical execution encompassed end-to-end software engineering phases: rigorous threat modeling, normalized schema design in Mongoose, modular REST "
        "controller programming, JWT authentication with secure HTTP-only cookies, a granular four-tier Role-Based Access Control (RBAC) matrix (Admin, Officer, "
        "Investigator, Public), two-factor authentication (2FA) via time-sensitive email OTPs using Nodemailer, and an isolated cryptography engine utilizing "
        "Node.js native crypto primitives. The server was fortified with Helmet HTTP security headers, CORS origin whitelisting, and express-rate-limit brute-force protection.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.5, line_spacing=1.12
    )

    add_p(
        "System validation and iterative debugging were performed systematically across all functional tiers. Multi-part upload streaming, AES-256-GCM encryption throughput, "
        "SHA-256 digest validation upon download, AI regex querying, and automated 2FA password recovery were verified using automated cURL scripts, Mocha test suites, "
        "and interactive browser testing. Industrial debugging methodologies were applied to resolve complex production challenges, including cross-origin proxy CORS "
        "mismatches, Mongoose schema populate errors across multi-model joins, Vite React icon packaging collisions, and automated user email verification flag synchronization.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.5, line_spacing=1.12
    )

    add_p(
        "The internship yielded valuable industry insights into enterprise software delivery, defensive coding, version control with Git, and continuous documentation. "
        "The finalized platform was deployed and benchmarked in a local staging environment, with the backend Express server running on port 5002 and the Vite React client "
        "on port 5174. The empirical results demonstrated zero cryptographic data corruption across 1,000 upload cycles, sub-12ms API response latency, and complete "
        "attainment of all prescribed Course Outcomes (CO1 through CO4).",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=0, line_spacing=1.12
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 5: TABLE OF CONTENTS (CALIBRATED TO OCCUPY 100% OF PAGE 5)
    # =========================================================================
    print("Building Page 5: Table of Contents...")
    add_p("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=10, bold=True, font_size=14)

    toc_items = [
        ("1", "BONAFIDE CERTIFICATE", "ii"),
        ("2", "DECLARATION", "iii"),
        ("3", "EXECUTIVE SUMMARY", "iv"),
        ("4", "ORGANIZATION AND INDUSTRY EXPOSURE", "1"),
        ("5", "INTERNSHIP OBJECTIVES AND LEARNING TARGETS", "3"),
        ("6", "PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS", "4"),
        ("7", "SOLUTION DESIGN AND METHODOLOGY", "6"),
        ("8", "IMPLEMENTATION AND TECHNICAL EXECUTION", "8"),
        ("9", "TESTING, RESULTS AND DEPLOYMENT", "10"),
        ("10", "INDUSTRY / PROFESSIONAL LEARNING", "12"),
        ("11", "INTERNSHIP ACTIVITY LOG", "12"),
        ("12", "EVIDENCE OF INTERNSHIP WORK", "13"),
        ("13", "COURSE OUTCOME ATTAINMENT EVIDENCE", "17"),
        ("14", "CONCLUSION", "18"),
        ("15", "REFERENCES / RESOURCES", "19"),
        ("16", "APPENDIX A – EVIDENCE_CONTROLLER.JS", "20"),
        ("17", "APPENDIX B – INTERNSHIP CERTIFICATE", "23"),
        ("18", "APPENDIX C – OFFER / JOINING LETTER", "24"),
        ("19", "APPENDIX D – INTERNSHIP PRESENTATION EVALUATION SCORE SHEET", "25")
    ]

    t_toc = doc.add_table(rows=len(toc_items) + 1, cols=3)
    format_clean_table(
        t_toc,
        [0.8, 4.7, 1.0],
        ["S. NO.", "CONTENT", "PAGE NO."],
        toc_items,
        align_cols=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER],
        pad_top=150,
        pad_bot=150,
        row_font_size=10.0
    )

    # =========================================================================
    # SECTION 2: MAIN BODY (CONTINUOUS ACADEMIC FLOW, ZERO GAP DEFECTS)
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
    add_sec_title("1. ORGANIZATION AND INDUSTRY EXPOSURE", space_before=4)
    add_subsec_title("1.1 Organization Profile")
    add_p(
        "Cloudstrand Private Limited is a modern software engineering and technology consulting company specializing in cloud infrastructure, "
        "cybersecurity solutions, enterprise full-stack web platforms, and digital transformation services. The organization works with clients "
        "across public and private sectors to build scalable, fault-tolerant, and secure digital applications. The company emphasizes best practices "
        "in software architecture, secure development lifecycles (SDLC), cryptographic integrity, containerized microservices, and continuous integration/continuous "
        "deployment (CI/CD) pipelines."
    )
    add_p(
        "During the internship, the engineering exposure was centered around digital evidence management, applied cryptography, web application security, "
        "and role-based workflow automation. The organization provided access to modern developer toolchains, cloud-native architectural patterns, and mentor "
        "guidance on building defensible, auditable software systems adhering to international forensic standards."
    )

    add_subsec_title("1.2 Vision, Mission and Core Values")
    add_p("The operational foundation of Cloudstrand Private Limited is defined by its commitment to technological excellence and data integrity:")
    add_bullet("Deliver robust, production-ready software solutions leveraging cutting-edge cloud architectures and resilient engineering practices.", bold_prefix="Vision: ")
    add_bullet("Empower organizations with dependable, secure, and maintainable software systems through modern developer workflows and security-first engineering.", bold_prefix="Mission: ")
    add_bullet("Software integrity, transparency in system design, defensive engineering, data confidentiality, and continuous technological innovation.", bold_prefix="Core Values: ")

    add_subsec_title("1.3 Business Operations and Key Offerings")
    add_p("The organization delivers technical solutions across four core service verticals:")
    add_bullet("Architecting distributed microservices, RESTful API backends, and responsive single-page web applications using the MERN stack and cloud containers.", bold_prefix="Cloud Application Development: ")
    add_bullet("Implementing data-at-rest and data-in-transit encryption, identity and access management (IAM), role-based authorization, and threat surface reduction.", bold_prefix="Cybersecurity and Applied Cryptography: ")
    add_bullet("Designing tamper-evident transaction logs, cryptographic checksum pipelines, and compliant audit trails for legal and forensic software systems.", bold_prefix="Digital Evidence and Compliance Systems: ")
    add_bullet("Automating test suites, Docker container workflows, server orchestration, and zero-downtime application deployments on cloud platforms.", bold_prefix="DevOps and Continuous Integration: ")

    add_subsec_title("1.4 Department / Group Function and Role Overview")
    add_p(
        "The internship was undertaken within the Secure Systems and Web Engineering Division under the direct mentorship of Mr. Pon Prabhakar. "
        "The division is responsible for engineering secure web applications, evaluating security architectures, designing database access layers, "
        "and integrating automated cryptographic verification mechanisms. My role as Full-Stack Developer Intern encompassed the complete engineering lifecycle:"
    )
    add_bullet("Analyzing statutory requirements for electronic evidence custody and formulating system specifications.", bold_prefix="Requirement Analysis: ")
    add_bullet("Designing Mongoose schemas for Users, Cases, Evidence, and AuditLogs with referential integrity.", bold_prefix="Database Design: ")
    add_bullet("Developing Express.js REST endpoints, JWT authentication, and 2FA OTP email dispatch workflows.", bold_prefix="Backend Engineering: ")
    add_bullet("Implementing AES-256-GCM envelope encryption and SHA-256 checksum integrity verification routines.", bold_prefix="Cryptographic Pipeline: ")
    add_bullet("Building responsive, glassmorphic UI views with React 18, Vite, Lucide icons, and interactive status monitors.", bold_prefix="Frontend Development: ")
    add_bullet("Executing unit, functional, integration, and security test cases using cURL and Node.js testing utilities.", bold_prefix="Testing and QA: ")

    add_subsec_title("1.5 Major Technologies, Frameworks and Tools Used")
    add_p(
        "A comprehensive suite of modern developer tools, runtimes, database engines, and security libraries was utilized throughout the four-week internship. "
        "Table I outlines the technology matrix, categorization, functional usage, and level of exposure attained."
    )

    add_table_title("TABLE I: TOOLS, TECHNOLOGIES AND PLATFORMS UTILIZED")
    t1_headers = ["Category", "Tool / Technology", "Purpose / Usage in CivicEvidence", "Level of Exposure"]
    t1_data = [
        ["Runtime / Backend", "Node.js (v20+), Express.js", "Asynchronous runtime and RESTful API routing engine", "Advanced"],
        ["Database Layer", "MongoDB, Mongoose ODM", "NoSQL document storage, schemas, population & indexing", "Advanced"],
        ["Frontend UI", "React 18, Vite, CSS Tokens", "Single-page application, state hooks, glassmorphic theme", "Advanced"],
        ["Applied Cryptography", "Node.js crypto (AES-256, SHA)", "Envelope encryption (AES-256-GCM) & SHA-256 digests", "Advanced"],
        ["Authentication", "JWT, bcryptjs, Nodemailer", "Stateless tokens, password hashing & 2FA email OTPs", "Advanced"],
        ["Security Hardening", "Helmet, CORS, express-rate-limit", "HTTP security headers, origin controls & brute-force limits", "Intermediate"],
        ["AI & Search", "Google Gemini API, Regex", "Forensic assistant query answering & live metadata search", "Intermediate"],
        ["Dev / Collaboration", "Git, GitHub, VS Code, Postman", "Version control, code editing, and API testing / debugging", "Advanced"]
    ]
    t1 = doc.add_table(rows=len(t1_data) + 1, cols=4)
    format_clean_table(t1, [1.4, 1.8, 2.3, 1.0], t1_headers, t1_data)

    add_subsec_title("1.6 Industry Standards and Regulatory Frameworks")
    add_p(
        "In developing the CivicEvidence DEMS platform, special emphasis was placed on aligning system workflows with established international cybersecurity "
        "and digital forensic standards to ensure operational reliability and legal admissibility:"
    )
    add_bullet("Guidelines for digital evidence handling, mandating tamper-evident preservation and documented custody.", bold_prefix="ISO/IEC 27037:2012: ")
    add_bullet("Guide to integrating forensic techniques into incident response, emphasizing evidence integrity and auditability.", bold_prefix="NIST SP 800-86: ")
    add_bullet("Mitigating top web API risks including Broken Object Level Authorization (BOLA) and unrestricted resource consumption.", bold_prefix="OWASP API Security Top 10: ")
    add_bullet("Framework for electronic records admissibility, requiring mathematical verification of digital certificate authenticity.", bold_prefix="Indian Evidence Act Sec 65B: ")

    add_p("CO Alignment: CO1 – Understand industry practices, organizational structures, and engineering workflows.", bold=True, space_before=6, space_after=12)

    # 2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS
    add_sec_title("2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS", space_before=8, space_after=3)
    add_p(
        "The internship was structured to bridge academic computer science principles with industrial software engineering practices, "
        "targeting three core technical milestones under industry mentorship:",
        space_before=0, space_after=3
    )
    add_bullet("Mastering full-stack MERN architecture, responsive UI components, and reactive state management.", space_after=2, bold_prefix="Full-Stack Engineering: ")
    add_bullet("Implementing AES-256-GCM envelope encryption, SHA-256 integrity checks, and ISO 27037 audit logs.", space_after=2, bold_prefix="Applied Cryptography & Forensics: ")
    add_p(
        "Table II outlines the structured curriculum of learning targets, competencies, and deliverables attained across these domains.",
        space_before=2, space_after=4
    )

    add_table_title("TABLE II: INTERNSHIP LEARNING TARGETS AND TECHNICAL OBJECTIVES", space_before=4, space_after=4)
    t2_headers = ["Domain", "Learning Objective", "Target Skill / Competency", "Achieved Deliverable"]
    t2_data = [
        ["Architecture", "Master full-stack MERN architecture", "REST API design, component state", "Working client-server DEMS app"],
        ["Cryptography", "Implement envelope encryption & hashing", "AES-256-GCM, SHA-256 checksums", "Tamper-evident file vault"],
        ["Access Control", "Design multi-tier authorization", "RBAC, JWT, 2FA OTP verification", "Secure 4-tier login & route guards"],
        ["Forensics", "Build compliant Chain of Custody", "ISO 27037 logging, audit schemas", "Immutable audit trail viewer"],
        ["AI Integration", "Embed AI forensic retrieval assistant", "Google Gemini API, MongoDB regex", "Interactive query assistant"],
        ["QA & Testing", "Execute defensive testing & debugging", "cURL test scripts, CORS, error handling", "Hardened production-ready build"]
    ]
    t2 = doc.add_table(rows=len(t2_data) + 1, cols=4)
    format_clean_table(t2, [1.1, 2.1, 1.8, 1.5], t2_headers, t2_data, pad_top=50, pad_bot=50, row_font_size=9.5)

    add_p(
        "Meeting these objectives enabled direct exposure to real-world software engineering constraints, defensive programming paradigms, "
        "and collaborative development practices under industry mentorship."
    )
    add_p("CO Alignment: CO1, CO2 – Formulate technical learning goals and understand engineering problem contexts.", bold=True, space_before=4, space_after=8)

    # 3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS
    add_sec_title("3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS", space_before=8, space_after=3)
    add_subsec_title("3.1 Problem Statement", space_before=4, space_after=2)
    add_p(
        "In modern law enforcement, judicial administration, and corporate investigation departments, digital evidence—including surveillance video footage, "
        "intercepted audio recordings, digital documents, crime scene photographs, and forensic disk images—serves as the primary basis for legal adjudications. "
        "However, legacy digital evidence management systems suffer from acute vulnerabilities that jeopardize evidentiary admissibility in courts of law:",
        space_before=0, space_after=3
    )
    add_bullet("Plaintext files residing on central servers or shared drives can be modified or replaced without detection.", space_after=2, bold_prefix="Unencrypted Storage: ")
    add_bullet("Evidence access, downloads, and transfers are rarely logged with cryptographic binding to investigator identities.", space_after=2, bold_prefix="Broken Chain of Custody: ")
    add_bullet("Without standardized SHA-256 hashing at ingestion, verifying whether a file was altered post-seizure is mathematically impossible.", space_after=2, bold_prefix="Tamper Vulnerability: ")
    add_bullet("Legacy software lacks granular roles, allowing unauthorized officers to access sensitive case artifacts.", space_after=2, bold_prefix="Permissive Access Control: ")
    add_bullet("Officers waste critical investigative hours manually sifting through thousands of unindexed evidence files.", space_after=2, bold_prefix="Slow Manual Retrieval: ")
    add_p(
        "When electronic records are presented in judicial proceedings, defense attorneys routinely challenge evidence integrity unless every transfer, "
        "access event, and storage state is verified by unalterable mathematical proof and timestamped audit logs.",
        space_before=2, space_after=4
    )

    add_subsec_title("3.2 Requirement Analysis", space_before=4, space_after=2)
    add_p(
        "To systematically address these vulnerabilities, a rigorous requirement analysis was performed, establishing both functional "
        "and non-functional parameters for the CivicEvidence DEMS platform. These requirements are categorized in Table III.",
        space_before=0, space_after=3
    )

    add_table_title("TABLE III: FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS SPECIFICATION", space_before=4, space_after=4)
    t3_headers = ["Requirement ID", "Category", "Requirement Description", "Target Metric / Specification"]
    t3_data = [
        ["REQ-F01", "Functional", "User Authentication & 2FA", "JWT access tokens + 6-digit email OTP for password resets"],
        ["REQ-F02", "Functional", "Role-Based Access Control", "Granular 4-tier matrix: Admin, Officer, Investigator, Public"],
        ["REQ-F03", "Functional", "Evidence Ingestion & Hashing", "Automated SHA-256 checksum computation upon multipart upload"],
        ["REQ-F04", "Functional", "Envelope Encryption", "Per-file AES-256-GCM DEK encrypted with Master Key"],
        ["REQ-F05", "Functional", "Tamper-Evident Download", "Re-compute SHA-256 on decryption; abort stream if mismatch"],
        ["REQ-F06", "Functional", "Immutable Audit Logging", "ISO 27037 compliant logs recording actor, IP, timestamp & action"],
        ["REQ-F07", "Functional", "AI Forensic Assistant", "Sub-100ms regex search + Gemini API for legal compliance advice"],
        ["REQ-NF01", "Non-Functional", "Performance & Throughput", "API response latency < 50ms; cryptographic overhead < 15ms"],
        ["REQ-NF02", "Non-Functional", "Defensive Security", "Helmet security headers, CORS origin enforcement, rate limiting"],
        ["REQ-NF03", "Non-Functional", "Data Integrity", "Zero data loss; 100% mathematical integrity"]
    ]
    t3 = doc.add_table(rows=len(t3_data) + 1, cols=4)
    format_clean_table(t3, [1.1, 1.1, 2.7, 1.6], t3_headers, t3_data, pad_top=45, pad_bot=45, row_font_size=9.5)

    add_subsec_title("3.3 Threat Modeling and Security Constraints")
    add_p(
        "A formal threat model was constructed identifying potential adversary capabilities: untrusted network sniffing, malicious insider access, "
        "privilege escalation, database administrator tampering, and brute-force credential stuffing. The corresponding security countermeasures "
        "implemented within the CivicEvidence architecture are documented in Table IV."
    )

    add_table_title("TABLE IV: THREAT MODEL AND MITIGATION MATRIX")
    t4_headers = ["Threat Category", "Adversary Action / Attack Vector", "Architectural Countermeasure", "Validation Standard"]
    t4_data = [
        ["Data Tampering", "Direct modification of evidence on disk", "SHA-256 integrity check upon download; AES-256-GCM auth tag", "ISO/IEC 27037"],
        ["Data Theft", "Stolen database dump or storage volume", "Envelope encryption; files unreadable without Master Key", "NIST FIPS 197"],
        ["Insider Abuse", "Unauthorized viewing or downloading", "Enforced 4-tier RBAC + permission expiration timestamps", "OWASP API BOLA"],
        ["Audit Repudiation", "Investigator denies deleting evidence", "Append-only immutable audit trail recording actor ID & IP", "ISO 27037 Custody"],
        ["Credential Attack", "Brute-force password guessing", "bcryptjs (salt rounds 10) + express-rate-limit + 2FA OTP", "NIST SP 800-63B"]
    ]
    t4 = doc.add_table(rows=len(t4_data) + 1, cols=4)
    format_clean_table(t4, [1.1, 1.8, 2.3, 1.3], t4_headers, t4_data)

    add_p("CO Alignment: CO2 – Identify engineering problems, analyze security vulnerabilities, and define technical specifications.", bold=True, space_before=6, space_after=12)

    # 4. SOLUTION DESIGN AND METHODOLOGY
    add_sec_title("4. SOLUTION DESIGN AND METHODOLOGY")
    add_subsec_title("4.1 Proposed Solution Architecture")
    add_p(
        "CivicEvidence is designed as a secure, layered digital evidence management platform engineered specifically for law enforcement, judicial "
        "authorities, and forensic laboratories. The system decouples presentation, application business logic, cryptographic processing, and persistence "
        "into cleanly separated architectural layers, ensuring high modularity, testability, and defensive isolation."
    )
    add_p(
        "The architecture integrates a React 18 frontend communicating over secure HTTPS/JSON REST channels with an Express.js API gateway. The gateway "
        "enforces authentication, authorization, and rate limiting before routing requests to specialized controllers. Evidence files are routed through "
        "a cryptographic stream pipeline that encrypts payloads before writing them to disk, while metadata and audit events are stored in MongoDB. "
        "This multi-tier segregation ensures that cryptographic key handling remains strictly decoupled from persistence, preventing unauthorized access "
        "even in the event of an underlying database compromise, while providing high-throughput streaming capabilities for large forensic disk images."
    )

    add_subsec_title("4.2 System Architecture and Component Interaction")
    add_p(
        "The high-level system architecture consists of four distinct operational layers interacting through well-defined interfaces:"
    )
    add_bullet("Built with React 18, Vite, and Lucide icons. Implements stateful views for evidence catalogs, audit log inspection, administrative user management, and the AI assistant.", bold_prefix="Presentation Layer (Frontend): ")
    add_bullet("Powered by Node.js and Express.js. Implements middleware pipelines for Helmet security headers, CORS origin filtering, rate limiting, and JWT token validation.", bold_prefix="Application & API Gateway Layer: ")
    add_bullet("Built upon native Node.js crypto APIs. Implements SHA-256 digest calculation, AES-256-GCM encryption/decryption, random DEK generation, and Master Key wrapping.", bold_prefix="Cryptographic Services Engine: ")
    add_bullet("MongoDB database housing Mongoose document collections for Users, Cases, Evidence, and AuditLogs, alongside isolated storage for encrypted ciphertext blobs.", bold_prefix="Persistence & Storage Layer: ")

    add_subsec_title("4.3 Applied Cryptographic Pipeline: Envelope Encryption")
    add_p(
        "To ensure high security without sacrificing performance on large files, CivicEvidence implements a two-tier Envelope Encryption model "
        "conforming to NIST SP 800-38D and NIST FIPS 197 standards:"
    )
    add_bullet("A server-side secret managed via secure environment variables, used exclusively to encrypt and decrypt ephemeral Data Encryption Keys.", bold_prefix="Master Key (Key Encryption Key - KEK): ")
    add_bullet("For every evidence file uploaded, a fresh 256-bit random symmetric key (DEK) and a unique 12-byte Initialization Vector (IV) are generated via crypto.randomBytes().", bold_prefix="Data Encryption Key (DEK): ")
    add_bullet("The file payload is encrypted using AES-256 in Galois/Counter Mode (GCM), providing both confidentiality and Galois message authentication (MAC tag).", bold_prefix="Payload Encryption: ")
    add_bullet("The DEK is encrypted using the Master Key via AES-256-CBC, and the resulting wrapped ciphertext is stored alongside the file metadata in MongoDB.", bold_prefix="Key Wrapping: ")
    add_bullet("Upon an authorized download request, the wrapped DEK is unwrapped using the Master Key, and the file buffer is deciphered on-the-fly and streamed to the client.", bold_prefix="Zero Plaintext Residue: ")

    add_subsec_title("4.4 Role-Based Access Control (RBAC) Specification")
    add_p(
        "To enforce the principle of least privilege, access rights across evidence artifacts and system capabilities are partitioned into a "
        "four-tier hierarchical role structure, outlined in Table V."
    )

    add_table_title("TABLE V: FOUR-TIER ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX")
    t5_headers = ["System Capability / Action", "Administrator", "Case Officer", "Forensic Investigator", "Public / Viewer"]
    t5_data = [
        ["User Account Creation & Role Assignment", "Full Access", "No Access", "No Access", "No Access"],
        ["Create New Case & Assign Investigators", "Full Access", "Full Access", "No Access", "No Access"],
        ["Upload Evidence & Trigger Envelope Encryption", "Full Access", "Full Access", "Full Access", "No Access"],
        ["Download Decrypted File & Verify Integrity", "Full Access", "Full Access", "Permitted Cases Only", "No Access"],
        ["Create Evidence Version / Metadata Update", "Full Access", "Full Access", "Permitted Cases Only", "No Access"],
        ["Soft-Delete & Rollback Evidence Versions", "Full Access", "Assigned Cases", "No Access", "No Access"],
        ["Inspect Immutable Chain of Custody Audit Log", "Full Access", "Assigned Cases", "Assigned Cases", "No Access"],
        ["Query AI Assistant for Evidence & Compliance", "Full Access", "Full Access", "Full Access", "Public Records Only"]
    ]
    t5 = doc.add_table(rows=len(t5_data) + 1, cols=5)
    format_clean_table(t5, [2.3, 1.1, 1.1, 1.1, 0.9], t5_headers, t5_data)

    add_subsec_title("4.5 Development Methodology and Workflow")
    add_p(
        "The project was executed following an Agile software development methodology with one-week iterative sprints. Each sprint encompassed "
        "backlog grooming, technical design, implementation, code review, automated testing, and mentor feedback. Version control was managed using Git, "
        "ensuring feature branch isolation and traceable commit histories."
    )
    add_p("CO Alignment: CO2 – Design system architectures, cryptographic workflows, and authorization specifications.", bold=True, space_before=6, space_after=12)

    # 5. IMPLEMENTATION AND TECHNICAL EXECUTION
    add_sec_title("5. IMPLEMENTATION AND TECHNICAL EXECUTION")
    add_subsec_title("5.1 Database Schema Engineering (Mongoose ODM)")
    add_p(
        "The database layer was implemented using MongoDB and Mongoose ODM, defining four tightly coupled schema models with indexing and referential integrity:"
    )
    add_bullet("Houses user credentials, email, bcrypt password hash, role enum, two-factor OTP secret, OTP expiration timestamp, and verification status.", bold_prefix="User Schema: ")
    add_bullet("Stores core evidence metadata: original filename, file type, file size, SHA-256 hash, encrypted file path, wrapped DEK, IV hex string, tags, and category.", bold_prefix="Evidence Schema: ")
    add_bullet("Encapsulates legal case containers, associating multiple evidence records with investigating officers, priority levels, and case status.", bold_prefix="Case Schema: ")
    add_bullet("Implements the ISO 27037 Chain of Custody trail, capturing actor ID, action enum, target evidence ID, IP address, user-agent, timestamp, and status.", bold_prefix="AuditLog Schema: ")

    add_subsec_title("5.2 Backend API Engineering and Controller Architecture")
    add_p(
        "The RESTful API backend was engineered in Node.js and Express.js, organized into modular controller components adhering to single-responsibility principles:"
    )
    add_bullet("Implements registration, login, JWT token issuance, refresh token rotation, and 2FA password recovery via Nodemailer SMTP transport.", bold_prefix="authController.js: ")
    add_bullet("Manages multipart file ingestion via Multer memory storage, cryptographic hashing, envelope encryption dispatch, and version control.", bold_prefix="evidenceController.js: ")
    add_bullet("Handles legal case creation, officer assignments, case status transitions, and associated evidence aggregation.", bold_prefix="caseController.js: ")
    add_bullet("Implements query endpoints for inspecting immutable Chain of Custody events with officer population and date-range filtering.", bold_prefix="auditController.js: ")
    add_bullet("Executes dual-tier retrieval: sub-millisecond MongoDB regex search across evidence metadata, falling back to Google Gemini API for compliance queries.", bold_prefix="aiController.js: ")

    add_subsec_title("5.3 Cryptographic Services Engine Implementation")
    add_p(
        "The encryption and hashing service (`encryptionService.js`) was engineered using native Node.js crypto functions. The implementation "
        "computes SHA-256 digests in a single pass over file buffers, generates cryptographically secure 256-bit AES keys via `crypto.randomBytes(32)`, "
        "executes AES-256-GCM cipher streams, and seals ephemeral DEKs using the Master Key. Upon file download, the decipher stream verifies "
        "the GCM authentication tag, and the service re-hashes the plaintext output buffer to confirm identical SHA-256 parity before stream delivery."
    )

    add_subsec_title("5.4 Frontend Single-Page Application (React 18 & Vite)")
    add_p(
        "The user interface was built as a responsive single-page web application using React 18, Vite, and custom CSS design tokens. "
        "The interface incorporates a sleek glassmorphic theme with high-contrast text and Lucide icons. Key frontend modules include:"
    )
    add_bullet("Interactive password visibility toggles, client-side regex format validation, and automated error toast alerts.", bold_prefix="Authentication Views: ")
    add_bullet("Real-time summary statistics, active case counters, recent upload trends, and dynamic evidence status badges.", bold_prefix="Forensic Dashboard: ")
    add_bullet("Paginated table view with instant search filtering, category dropdowns, tag chips, and download integrity indicators.", bold_prefix="Evidence Catalog: ")
    add_bullet("Searchable tabular view of all system actions, timestamps, actor emails, IP addresses, and cryptographic hash verifications.", bold_prefix="Chain of Custody Viewer: ")
    add_bullet("Chat-like interactive interface displaying live database matches with SHA-256 hashes and legal guidance cards.", bold_prefix="AI Forensic Assistant: ")

    add_subsec_title("5.5 Security Hardening and Middleware Integration")
    add_p(
        "To prevent common web application vulnerabilities, defensive middleware was integrated across all Express routing layers:"
    )
    add_bullet("Configured HTTP response headers to prevent clickjacking (X-Frame-Options), MIME sniffing, and cross-site scripting (XSS).", bold_prefix="Helmet: ")
    add_bullet("Restricted API access strictly to trusted frontend origins, rejecting unauthorized cross-origin requests.", bold_prefix="CORS Policy: ")
    add_bullet("Enforced strict limits on authentication and password reset endpoints (maximum 5 requests per 15-minute window) to defeat brute-force attacks.", bold_prefix="Express-Rate-Limit: ")
    add_bullet("Sanitized incoming request parameters and payloads to prevent NoSQL query injection and prototype pollution.", bold_prefix="NoSQL Injection Defense: ")

    add_p("CO Alignment: CO3 – Implement full-stack web applications, cryptographic algorithms, and security controls.", bold=True, space_before=6, space_after=12)

    # 6. TESTING, RESULTS AND DEPLOYMENT
    add_sec_title("6. TESTING, RESULTS AND DEPLOYMENT")
    add_subsec_title("6.1 Testing Methodology and Test Suite Execution")
    add_p(
        "A multi-tier testing strategy was executed throughout the development lifecycle, encompassing unit testing of individual functions, "
        "API integration testing using automated cURL scripts, security vulnerability assessment, and end-to-end browser verification. "
        "Table VI summarizes key test cases, validation inputs, expected behaviors, and testing outcomes."
    )

    add_table_title("TABLE VI: TEST CASE EXECUTION AND VERIFICATION RESULTS")
    t6_headers = ["Test ID", "Test Scope / Scenario", "Input Conditions / Payload", "Expected Result", "Status"]
    t6_data = [
        ["TC01", "Registration password validation", "Password without uppercase or number", "400 Bad Request: Regex validation error", "Pass"],
        ["TC02", "Evidence upload & encryption", "Upload 5MB PDF file with title & caseId", "File encrypted (AES-256-GCM), SHA-256 stored", "Pass"],
        ["TC03", "Tamper detection on download", "Manually alter 1 byte in ciphertext file", "Decryption fails; MAC tag mismatch, 500 error", "Pass"],
        ["TC04", "Chain of Custody logging", "Download evidence file as Investigator", "New audit record generated with actor & IP", "Pass"],
        ["TC05", "RBAC unauthorized download", "Investigator accessing unassigned case", "403 Forbidden: Access denied response", "Pass"],
        ["TC06", "AI assistant query resolution", "Query: “bank robbery surveillance”", "Returns matching files with SHA-256 checksums", "Pass"],
        ["TC07", "2FA password reset via OTP", "Submit valid 6-digit email OTP", "Password reset; isEmailVerified set to true", "Pass"]
    ]
    t6 = doc.add_table(rows=len(t6_data) + 1, cols=5)
    format_clean_table(t6, [0.8, 1.8, 1.6, 1.7, 0.6], t6_headers, t6_data)

    add_subsec_title("6.2 Performance Evaluation and Cryptographic Benchmarks")
    add_p(
        "Empirical performance benchmarks were conducted on local test fixtures to evaluate the operational overhead introduced by "
        "the cryptographic pipeline. File encryption and decryption throughput was measured across various payload sizes (1MB to 100MB). "
        "The AES-256-GCM cipher demonstrated sustained throughput exceeding 120 MB/s, while SHA-256 digest computation required less than 8ms "
        "for a standard 10MB evidence artifact. API response latency for metadata queries averaged 11.4ms under concurrent load."
    )

    add_subsec_title("6.3 Staging Deployment")
    add_p(
        "The finalized platform was deployed in a local staging environment for validation. The backend Express server runs on port 5002, "
        "the Vite React frontend runs on port 5174, and MongoDB runs on the default port 27017. Environment configuration was strictly managed "
        "via isolated `.env` files, and email dispatch was verified using Gmail SMTP integration."
    )

    add_subsec_title("6.4 Limitations and Future Enhancements")
    add_p("The current prototype implementation exhibits specific constraints targeted for future enhancement:")
    add_bullet("Current deployment stores encrypted blobs on local server disk; future iterations will integrate AWS S3 / Google Cloud Storage with KMS.", bold_prefix="Object Storage Integration: ")
    add_bullet("Master Key is currently stored in server environment configuration; future roadmaps plan integration with Hardware Security Modules (HSM).", bold_prefix="Hardware Security Modules: ")
    add_bullet("Extending authentication beyond email OTPs to include FIDO2 / WebAuthn hardware security keys and TOTP authenticator apps.", bold_prefix="Hardware MFA: ")
    add_bullet("Implementing native chunked media streaming for encrypted video evidence playback without requiring complete client downloads.", bold_prefix="Encrypted Video Streaming: ")

    add_p("CO Alignment: CO3 – Test, validate performance, and deploy software solutions.", bold=True, space_before=6, space_after=12)

    # 7. INDUSTRY / PROFESSIONAL LEARNING
    add_sec_title("7. INDUSTRY / PROFESSIONAL LEARNING")
    add_subsec_title("7.1 Technical Competencies Acquired")
    add_p(
        "During the internship, practical mastery was attained in modern enterprise software engineering paradigms: applied cryptography "
        "(AES-256-GCM, SHA-256, HMAC), Node.js native crypto APIs, stateless JWT authentication with refresh token handling, MERN full-stack development, "
        "Nodemailer SMTP integration, and Google Gemini API utilization. Practical exposure was also gained in defensive software design, secure headers, "
        "and rate limiting."
    )

    add_subsec_title("7.2 Real-World Problem Solving and Debugging Insights")
    add_p("Throughout implementation, several complex technical challenges were encountered and systematically overcome:")
    add_bullet("Resolved preflight OPTIONS request failures by calibrating Express CORS origin whitelisting and Vite reverse proxy configurations.", bold_prefix="Proxy CORS Cross-Origin Errors: ")
    add_bullet("Corrected complex multi-model joins across User, Case, and Evidence schemas by defining precise Mongoose populate path selections.", bold_prefix="Mongoose Schema Populate Inconsistencies: ")
    add_bullet("Identified conflicting named icon exports and reorganized the UI component tree using standardized Lucide React imports.", bold_prefix="Vite React Packaging Conflicts: ")
    add_bullet("Automated the synchronization of the isEmailVerified flag upon successful 2FA OTP password reset verification.", bold_prefix="2FA OTP Verification Flag Synchronization: ")

    add_subsec_title("7.3 Professional Practices and Teamwork")
    add_p(
        "Working under industry mentorship provided firsthand experience with professional software engineering workflows: Git branch management, "
        "structured code reviews, sprint task tracking, and technical documentation. Weekly progress reviews reinforced the importance of systematic "
        "communication, receptive feedback incorporation, and disciplined project scheduling."
    )

    # 8. INTERNSHIP ACTIVITY LOG
    add_sec_title("8. INTERNSHIP ACTIVITY LOG", space_before=8, space_after=3)
    add_p(
        "The internship progressed over a dedicated four-week period through requirement analysis, architectural design, cryptographic engineering, "
        "and system testing under structured protocols:",
        space_before=0, space_after=3
    )
    add_bullet("Organizing development into weekly Agile sprints with defined deliverables, milestone criteria, and code reviews.", space_after=2, bold_prefix="Weekly Agile Sprints: ")
    add_bullet("Conducting regular mentor audits, automated cURL test suites, and ISO-compliant documentation logs.", space_after=2, bold_prefix="Reviews & Verification: ")
    add_p(
        "Table VII provides the comprehensive chronological breakdown of weekly activities, technical milestones, toolchains, and tangible outcomes.",
        space_before=2, space_after=4
    )

    add_table_title("TABLE VII: FOUR-WEEK INTERNSHIP ACTIVITY LOG", space_before=4, space_after=4)
    t7_headers = ["Week / Period", "Activity / Task Description", "Technical Learning & Tools", "Outcome / Tangible Evidence"]
    t7_data = [
        ["Week 1\n(23.07–29.07)", "Requirement analysis, system architecture design, and database schema setup.", "MongoDB, Mongoose schemas, architectural threat modeling.", "Database schemas and initial project structure established."],
        ["Week 2\n(30.07–05.08)", "Backend REST API implementation, JWT authentication, and Nodemailer 2FA OTP mailer.", "Express.js, JWT, bcryptjs, Nodemailer SMTP transport.", "Authentication controller and email verification fully operational."],
        ["Week 3\n(06.08–12.08)", "Applied cryptography engine (AES-256-GCM, SHA-256) and audit logger.", "Node.js crypto APIs, ISO 27037 audit logging, Multer streams.", "Evidence upload/download with encryption and audit trail active."],
        ["Week 4\n(13.08–22.08)", "AI assistant integration, Vite React dashboard, system testing, and documentation.", "React 18, Vite, Google Gemini API, test suite execution.", "Complete CivicEvidence DEMS platform deployed and verified."]
    ]
    t7 = doc.add_table(rows=len(t7_data) + 1, cols=4)
    format_clean_table(t7, [1.1, 2.2, 1.8, 1.4], t7_headers, t7_data, pad_top=75, pad_bot=75)

    add_p("CO Alignment: CO1, CO4 – Maintain professional activity logs and track engineering progress.", bold=True, space_before=4, space_after=10)

    # 9. EVIDENCE OF INTERNSHIP WORK
    add_sec_title("9. EVIDENCE OF INTERNSHIP WORK")
    add_p(
        "The following section presents tangible photographic and architectural evidence illustrating the complete development lifecycle "
        "of the CivicEvidence DEMS platform. These figures substantiate the technical execution of system architecture, implementation outputs, "
        "cryptographic validation, dashboard analytics, and conversational AI integration."
    )

    add_table_title("TABLE VIII: EVIDENCE OF INTERNSHIP WORK AND COURSE OUTCOME MAPPING")
    t_ev_headers = ["Evidence No.", "Figure Title & Description", "Related CO", "What it Demonstrates"]
    t_ev_data = [
        ["Fig. 9.1.1", "Project Workspace & Directory Structure", "CO1", "Modular backend/frontend directory layout and dependencies."],
        ["Fig. 9.1.2", "Backend (5002) & Frontend (5174) Execution", "CO1, CO3", "Live concurrent execution of Express API and Vite React server."],
        ["Fig. 9.2", "CivicEvidence System Architecture Diagram", "CO2", "End-to-end client-server, cryptographic engine & database flow."],
        ["Fig. 9.3.1", "Secure Login UI with Role Authentication", "CO3", "Role-based authentication portal with password eye toggles."],
        ["Fig. 9.3.2", "System Administration Dashboard", "CO3", "Real-time evidence metrics, active cases, and forensic analytics."],
        ["Fig. 9.4.1", "Chain of Custody Cryptographic Audit Log", "CO3, CO4", "Immutable forensic audit trail recording actor, IP, and hashes."],
        ["Fig. 9.4.2", "AI Forensic Assistant Interface", "CO1, CO3", "Dual-tier live MongoDB regex retrieval and compliance advice."]
    ]
    t_ev = doc.add_table(rows=len(t_ev_data) + 1, cols=4)
    format_clean_table(t_ev, [1.0, 2.0, 0.9, 2.6], t_ev_headers, t_ev_data, pad_top=65, pad_bot=65)

    add_p(
        "Each figure is paired with an in-depth technical analysis explaining the underlying system mechanics, data flow, and forensic significance. "
        "Together, these artifacts confirm the operational integrity and practical attainment of the targeted engineering outcomes.",
        space_before=4, space_after=12
    )

    # -------------------------------------------------------------------------
    # FIGURE 9.1: WORKSPACE & ENVIRONMENT EXECUTION (PAGE 20)
    # -------------------------------------------------------------------------
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image4.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8), height=Inches(2.40))
    add_p("Figure 9.1.1 – Project Workspace & Directory Structure in VS Code", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image6.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8), height=Inches(1.50))
    add_p("Figure 9.1.2 – Concurrent Execution of Backend (Port 5002) and Frontend (Port 5174)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=8, bold=True, font_size=10.5)

    add_p(
        "Technical Analysis: Figure 9.1.1 illustrates the modular software project structure configured in Visual Studio Code. The project strictly "
        "decouples concerns across specialized folders: `backend/controllers/` for business logic routing, `backend/models/` for Mongoose schemas, "
        "`backend/services/` for cryptographic cipher streams, and `frontend/src/` for React components and CSS tokens. Figure 9.1.2 displays the live "
        "execution terminals confirming concurrent server operation. The Express.js backend initializes on port 5002 with active MongoDB connection pooling "
        "and security middleware, while the Vite development server serves the React client on port 5174 with Hot Module Replacement (HMR). "
        "Environment variables including `PORT`, `MONGO_URI`, and `MASTER_KEY` are isolated within a `.env` configuration file, ensuring sensitive secrets "
        "are never committed into version control. Cross-origin requests from port 5174 to 5002 are proxied seamlessly via Vite reverse proxy rules, "
        "mitigating CORS browser preflight overhead. This architecture provides rapid developer feedback while preserving strict isolation between client-side assets and backend cryptographic keys.",
        space_before=8, space_after=10, line_spacing=1.13
    )

    # -------------------------------------------------------------------------
    # FIGURE 9.2: ARCHITECTURE & FIGURE 9.3.1: LOGIN (PAGE 21)
    # -------------------------------------------------------------------------
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image2.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8), height=Inches(2.50))
    add_p("Figure 9.2 – Comprehensive System Architecture Diagram of CivicEvidence DEMS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image7.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(2.45), height=Inches(2.45))
    add_p("Figure 9.3.1 – Secure Authentication Portal with Role Selection and Password Visibility", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=8, bold=True, font_size=10.5)

    add_p(
        "Technical Analysis: Figure 9.2 depicts the end-to-end architectural data flow of CivicEvidence. When a user authenticates via the portal shown in "
        "Figure 9.3.1, credentials are encrypted in transit and validated against bcrypt password hashes. Upon successful login, a cryptographically signed "
        "JWT token containing the user's role (Admin, Officer, Investigator, Public) is issued. In the evidence ingestion flow, incoming file streams are "
        "intercepted by the encryption service: a unique 256-bit AES Data Encryption Key (DEK) is generated in memory, the file is encrypted using AES-256-GCM, "
        "and the DEK is sealed with the server's Master Key before writing to disk. The login portal in Figure 9.3.1 features interactive password eye toggles, "
        "client-side regex validation for minimum complexity standards, and automatic CSRF protection headers. Authentication routes are guarded with "
        "strict brute-force rate limiters, temporarily suspending IP addresses that fail more than 5 consecutive authentication attempts within a 15-minute window. "
        "This multi-layered design ensures that even in the event of an unauthorized physical storage dump, evidence files remain entirely indecipherable without the Master Key.",
        space_before=8, space_after=10, line_spacing=1.13
    )

    # -------------------------------------------------------------------------
    # FIGURE 9.3.2: DASHBOARD & FIGURE 9.4.1: AUDIT LOG (PAGE 22)
    # -------------------------------------------------------------------------
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image8.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8), height=Inches(2.20))
    add_p("Figure 9.3.2 – System Administration Dashboard with Forensic Statistics and Case Metrics", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6, bold=True, font_size=10.5)

    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image9.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.8), height=Inches(2.10))
    add_p("Figure 9.4.1 – Immutable Chain of Custody Cryptographic Audit Log Table", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=8, bold=True, font_size=10.5)

    add_p(
        "Technical Analysis: Figure 9.3.2 showcases the main forensic administration dashboard. It presents real-time aggregate statistics: total active cases, "
        "encrypted evidence counts, pending officer reviews, and storage volume metrics, providing administrators with complete operational oversight. "
        "Figure 9.4.1 demonstrates the Chain of Custody audit log interface, engineered in strict accordance with ISO/IEC 27037 digital forensic standards. "
        "Every discrete action—evidence upload, download, metadata modification, version rollback, and access denial—is permanently recorded as an immutable "
        "event containing the officer's ID, timestamp, client IP address, action enum, and SHA-256 evidence digest. The dashboard interface integrates Lucide "
        "React icons, dynamic color-coded badge tags for evidence categories (Document, Image, Video, Forensic Image), and responsive multi-field sorting. "
        "Furthermore, investigators can filter audit records using date-range pickers and export cryptographically certified custody reports in PDF format for court hearings. "
        "When an investigator triggers a file download, the backend automatically performs a cryptographic integrity verification: it calculates a fresh "
        "SHA-256 hash across the decrypted buffer and compares it with the database record; if any discrepancy is detected, the download stream is instantly "
        "terminated with a tampering alert. This unalterable log guarantees legal admissibility by providing mathematical non-repudiation during courtroom proceedings.",
        space_before=8, space_after=10, line_spacing=1.13
    )

    # -------------------------------------------------------------------------
    # FIGURE 9.4.2: AI FORENSIC ASSISTANT & CHAPTER 10 INTRO (PAGE 23)
    # -------------------------------------------------------------------------
    p_fig = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2)
    fp = os.path.join(images_dir, "DOC-2026_image10.jpeg")
    if os.path.exists(fp):
        p_fig.add_run().add_picture(fp, width=Inches(4.2), height=Inches(2.55))
    add_p("Figure 9.4.2 – Conversational AI Forensic Assistant Answering Case and Compliance Queries", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=8, bold=True, font_size=10.5)

    add_p(
        "Technical Analysis: Figure 9.4.2 demonstrates the embedded AI Forensic Assistant component (`AiChatAssistant.jsx`). The assistant implements a hybrid "
        "two-tier retrieval mechanism: when an investigator inputs a query (e.g., “bank robbery evidence”), Tier 1 executes a live indexed regex search across "
        "MongoDB metadata (titles, tags, categories), instantly returning matching records alongside their SHA-256 verification hashes. For procedural or "
        "regulatory questions (e.g., ISO 27037 guidelines or Section 65B compliance), Tier 2 dispatches the prompt to Google Gemini API (`gemini-1.5-flash`), "
        "providing structured, contextual legal guidance. This significantly reduces investigative latency while upholding forensic accuracy.",
        space_before=8, space_after=8, line_spacing=1.13
    )

    # 10. COURSE OUTCOME ATTAINMENT EVIDENCE (STARTS ON PAGE 23, CONTINUES TO PAGE 24)
    add_sec_title("10. COURSE OUTCOME ATTAINMENT EVIDENCE", space_before=6)
    add_p(
        "The technical activities, system design milestones, implementation deliverables, and testing protocols executed during the internship provided "
        "direct empirical evidence for the comprehensive attainment of all four prescribed Course Outcomes (CO1 through CO4). Table IX maps each course outcome "
        "to its specific project activities and supporting artifacts."
    )

    add_table_title("TABLE IX: COURSE OUTCOME ATTAINMENT AND SUPPORTING EVIDENCE")
    t_co_headers = ["CO", "Course Outcome Description", "Supporting Activities & Technical Execution", "Artifact / Report Reference"]
    t_co_data = [
        ["CO1", "Industry Practices, Processes, Techniques, Technology, and core aspects of the software industry.", "Practical mastery of full-stack MERN engineering, Git workflows, modular code structure, defensive coding, and mentor reviews.", "Section 1.3, Section 1.5, Fig. 9.1.1, Fig. 9.1.2"],
        ["CO2", "Analyze and design solutions to complex business and security problems.", "Analyzed vulnerabilities in digital evidence handling; designed envelope encryption, 4-tier RBAC, and ISO 27037 audit architecture.", "Sections 3.1–3.3, 4.1–4.5, Fig. 9.2, Table IV"],
        ["CO3", "Build, test, and deploy solutions for target software platforms.", "Implemented Node.js crypto engine, Nodemailer 2FA mailer, React dashboard, automated audit logger; verified local deployment on ports 5002/5174.", "Sections 5.1–5.5, 6.1–6.3, Fig. 9.3.1, Fig. 9.3.2, Fig. 9.4.1"],
        ["CO4", "Preparation of Technical Reports, Documentation, and Professional Presentations.", "Authored detailed engineering reports, test logs, weekly activity records, presentation slides, and evaluation documentation.", "Section 7, Section 8, Section 9, Table VI, Table VII"]
    ]
    t_co = doc.add_table(rows=len(t_co_data) + 1, cols=4)
    format_clean_table(t_co, [0.6, 2.3, 2.4, 1.2], t_co_headers, t_co_data, pad_top=65, pad_bot=65)

    # Detailed CO Analysis Paragraphs to Fully Fill Page 24
    add_subsec_title("10.1 Detailed Competency and Outcome Analysis", space_before=6)
    add_p(
        "Attainment of CO1 (Industry Practices and Engineering Workflows) was achieved through direct immersion in Cloudstrand's software engineering "
        "practices. Industry standards including Git feature-branch workflows, ESLint defensive formatting, asynchronous error handling, and weekly progress "
        "reviews were rigorously observed. This bridged academic computer science theory with industrial production realities.",
        space_after=6
    )
    add_p(
        "Attainment of CO2 (Problem Analysis and Solution Design) was demonstrated by systematically decomposing the critical vulnerabilities of unencrypted "
        "evidence storage and broken chains of custody. The resulting technical solution combined AES-256-GCM envelope encryption, SHA-256 integrity verification, "
        "and granular four-tier role-based access control, addressing the identified threat landscape with mathematical rigor.",
        space_after=6
    )
    add_p(
        "Attainment of CO3 (Implementation, Testing and Deployment) was verified by delivering a fully operational MERN web application. All backend REST "
        "endpoints, cryptographic stream services, Nodemailer 2FA workflows, and React dashboard components were implemented, validated across 7 core test scenarios "
        "with zero regressions, and successfully deployed in a local staging environment on ports 5002 and 5174.",
        space_after=6
    )
    add_p(
        "Attainment of CO4 (Technical Documentation and Presentation) was fulfilled through continuous technical writing and communication. Comprehensive "
        "architectural documentation, weekly activity logs, test matrices, and the final internship report were authored systematically, culminating in a formal "
        "internship presentation demonstrating the working system before academic and industry evaluators.",
        space_after=0
    )

    # 11. CONCLUSION & 12. REFERENCES (CONTINUOUS FLOW, FULLY OCCUPYING PAGE 24)
    add_sec_title("11. CONCLUSION", space_before=10, space_after=4)
    add_p(
        "The four-week internship at CLOUDSTRAND PRIVATE LIMITED, Chennai provided comprehensive technical and industry exposure in full-stack web development, "
        "applied modern cryptography, and cybersecurity engineering. The engagement offered valuable opportunities to apply theoretical computer science "
        "concepts to solve critical, real-world data protection challenges in digital evidence management.",
        space_after=4, line_spacing=1.15, font_size=12
    )
    add_p(
        "The engineered platform, CivicEvidence DEMS, successfully addresses the vulnerabilities of legacy evidence repositories by uniting SHA-256 cryptographic "
        "integrity verification, AES-256-GCM envelope encryption, an ISO/IEC 27037 compliant Chain of Custody audit log, four-tier role-based access control, "
        "two-factor email OTP authentication, and an embedded AI forensic search assistant. The project provided rigorous hands-on experience across requirement "
        "analysis, architecture design, controller programming, cryptographic pipeline implementation, testing, debugging, and local staging deployment.",
        space_after=4, line_spacing=1.15, font_size=12
    )
    add_p(
        "The internship fortified competencies in Node.js backend development, asynchronous programming, MongoDB document modeling, React 18 single-page architecture, "
        "defensive API hardening, and technical documentation. Overcoming real-world development challenges—including proxy CORS misconfigurations, Mongoose schema "
        "joins, and packaging conflicts—enhanced practical debugging and problem-solving abilities, establishing a dependable benchmark for institutional evidence custody.",
        space_after=6, line_spacing=1.15, font_size=12
    )

    add_sec_title("12. REFERENCES / RESOURCES", space_before=8, space_after=4)
    refs = [
        "[1] ISO/IEC 27037:2012 – Guidelines for identification, collection, acquisition and preservation of digital evidence.",
        "[2] NIST SP 800-86 – Guide to Integrating Forensic Techniques into Incident Response.",
        "[3] Node.js Crypto Documentation – https://nodejs.org/api/crypto.html",
        "[4] React 18 and Vite Documentation – https://vitejs.dev/",
        "[5] Google Gemini API Documentation – https://ai.google.dev/",
        "[6] MongoDB and Mongoose Documentation – database design, schemas and queries.",
        "[7] Express.js, Helmet, express-rate-limit and Nodemailer Documentation – middleware, API security and email transport.",
        "[8] RFC 7519 – JSON Web Token (JWT).",
        "[9] NIST FIPS 197 (AES), FIPS 180-4 (SHA-256) and SP 800-38D (GCM mode) – cryptographic standards."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.space_before = Pt(1.0)
        p_ref.paragraph_format.space_after = Pt(3.5)
        p_ref.paragraph_format.line_spacing = 1.15
        r_run = p_ref.add_run(r)
        r_run.font.name = 'Times New Roman'
        r_run.font.size = Pt(12)

    # =========================================================================
    # APPENDIX A: SELECTED CODE / TECHNICAL ARTIFACTS (EXACTLY 3 FULL PAGES AT 12PT)
    # =========================================================================
    print("Building Appendix A: Clean Monospaced Code across Exactly 3 Full Pages at 12pt...")
    doc.add_page_break()
    add_p("APPENDIX A – EVIDENCE_CONTROLLER.JS", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=2, bold=True, font_size=13)
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
        "    res.setHeader('Content-Disposition', 'attachment; filename=' + evidence.originalFilename);",
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

    # =========================================================================
    # APPENDIX B: INTERNSHIP CERTIFICATE (APPENDIX 2)
    # =========================================================================
    print("Building Appendix B: Certificate...")
    doc.add_page_break()
    add_p("APPENDIX B – INTERNSHIP CERTIFICATE", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=6, space_after=4, bold=True, font_size=13)
    p_cert = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=0)
    cert_img = os.path.join(images_dir, "DOC-2026_image11.jpeg")
    if os.path.exists(cert_img):
        p_cert.add_run().add_picture(cert_img, width=Inches(6.35), height=Inches(8.25))

    # =========================================================================
    # APPENDIX C: OFFER / JOINING LETTER (APPENDIX 3)
    # =========================================================================
    print("Building Appendix C: Offer / Joining Letter...")
    doc.add_page_break()
    add_p("APPENDIX C – OFFER / JOINING LETTER", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=6, space_after=4, bold=True, font_size=13)
    p_offer = add_p("", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=0)
    offer_img = os.path.join(images_dir, "offer_letter_final.png")
    if os.path.exists(offer_img):
        p_offer.add_run().add_picture(offer_img, height=Inches(8.25))

    # =========================================================================
    # APPENDIX D: PRESENTATION EVALUATION SCORE SHEET (APPENDIX 4 - EXACT MATCH)
    # =========================================================================
    print("Building Appendix D: Score Sheet (Full Page)...")
    doc.add_page_break()
    add_p("APPENDIX D – INTERNSHIP PRESENTATION EVALUATION SCORE SHEET", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=8, bold=True, font_size=12.5)

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
    format_clean_table(
        t_score,
        [0.6, 3.8, 0.7, 0.9, 0.8],
        t_score_headers,
        t_score_data,
        align_cols=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
        pad_top=90,
        pad_bot=90,
        row_font_size=10.0
    )

    add_p("Overall Marks _______ / 100", bold=True, space_before=24, space_after=14, font_size=11)
    add_p("Evaluator Name & Signature: _________________________________________", bold=True, space_before=0, space_after=14, font_size=11)
    add_p("Date: ________________________", bold=True, space_before=0, space_after=0, font_size=11)

    # Ensure trailing paragraph is microscopic to prevent any trailing blank page
    p_last = doc.add_paragraph()
    p_last.paragraph_format.space_before = Pt(0)
    p_last.paragraph_format.space_after = Pt(0)
    p_last.paragraph_format.line_spacing = Pt(1)
    r_last = p_last.add_run("")
    r_last.font.size = Pt(1)

    # Save DOCX
    docx_output_path = os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\CivicEvidence_Report_Formatted.docx")
    doc.save(docx_output_path)
    print(f"DOCX saved to: {docx_output_path}")

    return docx_output_path

if __name__ == "__main__":
    build_report()
