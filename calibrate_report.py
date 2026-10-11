import os
import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

def audit_pdf(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    print(f"\n================ AUDITING {pdf_path} (Total Pages: {len(reader.pages)}) ================")
    gap_count = 0
    for p_num, page in enumerate(reader.pages, 1):
        lowest_y = [1000.0]
        lowest_text = [""]
        def visitor(text, cm, tm, font_dict, font_size):
            if text.strip():
                y = tm[5]
                if y > 50:
                    if y < lowest_y[0]:
                        lowest_y[0] = y
                        lowest_text[0] = text.strip()
        page.extract_text(visitor_text=visitor)
        gap_pt = lowest_y[0] - 38.5 if lowest_y[0] < 1000 else 700
        gap_in = gap_pt / 72.0
        
        # Pages 1, 2, 3 are cover, bonafide, declaration (formal single-page legal layout)
        if p_num in [1, 2, 3]:
            status = f"FORMAL ({gap_in:.1f} in)"
        elif p_num == len(reader.pages) - 1 and len(page.images) > 0: # Appendix B certificate image
            status = "CERTIFICATE (IMG)"
        elif gap_pt < 68:
            status = "OK (FULL)"
        else:
            status = f"GAP ({gap_pt:.1f} pt = {gap_in:.2f} in)"
            gap_count += 1
            
        print(f"Page {p_num:2d} (imgs={len(page.images)}): lowest_y={lowest_y[0]:5.1f} | gap={gap_pt:5.1f} pt ({gap_in:.2f} in) -> {status} | '{lowest_text[0][:35]}'")
    print(f"\nTotal GAP pages: {gap_count}")
    return gap_count

if __name__ == "__main__":
    audit_pdf("civic evidence.pdf")
