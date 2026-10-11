import os
import sys
import shutil
import win32com.client

def format_and_export():
    docx_path = os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\CivicEvidence_Report_Formatted.docx")
    pdf_out = os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\civic evidence.pdf")

    print(f"Opening Word to format and export: {docx_path}")
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        doc = word.Documents.Open(docx_path)
        print(f"Document opened. Sections count: {doc.Sections.Count}")

        # 1. Configure page borders for all sections (exact match to PDF 1)
        for s_idx in range(1, doc.Sections.Count + 1):
            sec = doc.Sections(s_idx)
            for b_idx in [1, 2, 3, 4]: # wdBorderTop, wdBorderLeft, wdBorderBottom, wdBorderRight
                b = sec.Borders(b_idx)
                b.LineStyle = 1 # wdLineStyleSingle
                b.LineWidth = 4 # wdLineWidth050pt (0.5 pt)
                b.Color = 0 # Black
            sec.Borders.DistanceFrom = 1 # wdBorderDistanceFromPage
            sec.Borders.DistanceFromTop = 24
            sec.Borders.DistanceFromBottom = 24
            sec.Borders.DistanceFromLeft = 24
            sec.Borders.DistanceFromRight = 24

        # 2. Configure Footers
        # Section 1: Front matter (Pages 1 to 5)
        sec1 = doc.Sections(1)
        ftr1 = sec1.Footers(1) # wdHeaderFooterPrimary
        ftr1.LinkToPrevious = False
        p1 = ftr1.Range.Paragraphs(1)
        p1.Range.Text = "\tCS3711 \u2013 Summer Internship\t"
        p1.Range.Font.Name = "Times New Roman"
        p1.Range.Font.Size = 12
        rng1 = p1.Range
        rng1.Collapse(0) # wdCollapseEnd
        doc.Fields.Add(rng1, 33) # 33 = wdFieldPage
        pn1 = ftr1.PageNumbers
        pn1.NumberStyle = 2 # 2 = wdPageNumberStyleLowercaseRoman
        pn1.RestartNumberingAtSection = True
        pn1.StartingNumber = 1

        # Section 2: Main Body (Pages 6 onwards)
        if doc.Sections.Count >= 2:
            sec2 = doc.Sections(2)
            ftr2 = sec2.Footers(1)
            ftr2.LinkToPrevious = False
            p2 = ftr2.Range.Paragraphs(1)
            p2.Range.Text = "\tCS3711 \u2013 Summer Internship\t"
            p2.Range.Font.Name = "Times New Roman"
            p2.Range.Font.Size = 12
            rng2 = p2.Range
            rng2.Collapse(0)
            doc.Fields.Add(rng2, 33)
            pn2 = ftr2.PageNumbers
            pn2.NumberStyle = 0 # 0 = wdPageNumberStyleArabic
            pn2.RestartNumberingAtSection = True
            pn2.StartingNumber = 1

        doc.Fields.Update()

        # 3. Find the Table of Contents table (table with 20 rows)
        toc_table = None
        for t_idx in range(1, doc.Tables.Count + 1):
            t = doc.Tables(t_idx)
            if t.Rows.Count >= 18 and t.Columns.Count == 3:
                toc_table = t
                print(f"Found TOC Table at index {t_idx} with {t.Rows.Count} rows.")
                break

        # 4. Heading search in Section 2 only
        heading_keys = [
            ("1. ORGANIZATION AND INDUSTRY EXPOSURE", 5),
            ("2. INTERNSHIP OBJECTIVES AND LEARNING TARGETS", 6),
            ("3. PROBLEM / REQUIREMENT IDENTIFICATION AND ANALYSIS", 7),
            ("4. SOLUTION DESIGN AND METHODOLOGY", 8),
            ("5. IMPLEMENTATION AND TECHNICAL EXECUTION", 9),
            ("6. TESTING, RESULTS AND DEPLOYMENT", 10),
            ("7. INDUSTRY / PROFESSIONAL LEARNING", 11),
            ("8. INTERNSHIP ACTIVITY LOG", 12),
            ("9. EVIDENCE OF INTERNSHIP WORK", 13),
            ("10. COURSE OUTCOME ATTAINMENT EVIDENCE", 14),
            ("11. CONCLUSION", 15),
            ("12. REFERENCES / RESOURCES", 16),
            ("APPENDIX A – EVIDENCE_CONTROLLER.JS", 17),
            ("APPENDIX B – INTERNSHIP CERTIFICATE", 18),
            ("APPENDIX C – OFFER / JOINING LETTER", 19),
            ("APPENDIX D – INTERNSHIP PRESENTATION", 20)
        ]

        if toc_table and doc.Sections.Count >= 2:
            sec2_range = doc.Sections(2).Range
            for h_text, row_idx in heading_keys:
                find_rng = sec2_range.Duplicate
                find = find_rng.Find
                find.ClearFormatting()
                find.Text = h_text
                find.Forward = True
                find.Wrap = 0 # wdFindStop
                if find.Execute():
                    actual_page = find_rng.Information(1) # wdActiveEndPageNumber (section-relative footer page number)
                    print(f"Heading '{h_text[:35]}' found on body page: {actual_page}")
                    if row_idx <= toc_table.Rows.Count:
                        cell = toc_table.Cell(row_idx, 3)
                        cell.Range.Text = str(actual_page)
                        cell.Range.Paragraphs(1).Alignment = 1 # Center
                        cell.Range.Font.Name = "Times New Roman"
                        cell.Range.Font.Size = 10

        # Save and Export
        doc.Save()
        print(f"Exporting to PDF: {pdf_out}")
        doc.ExportAsFixedFormat(pdf_out, 17) # 17 = wdExportFormatPDF
        doc.Close(False)
        print("Export completed successfully!")

    finally:
        word.Quit()

    # Destination copies
    destinations = [
        os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\CivicEvidence.pdf"),
        os.path.abspath(r"C:\Users\asara\Downloads\civic evidence.pdf"),
        os.path.abspath(r"C:\Users\asara\Downloads\Civic Evidence.pdf"),
        os.path.abspath(r"C:\Users\asara\Downloads\CivicEvidence.pdf")
    ]
    for dst in destinations:
        try:
            if not os.path.exists(dst) or not os.path.samefile(pdf_out, dst):
                shutil.copyfile(pdf_out, dst)
                print(f"Copied to: {dst}")
        except Exception as e:
            print(f"Copy note for {dst}: {e}")

if __name__ == "__main__":
    format_and_export()
