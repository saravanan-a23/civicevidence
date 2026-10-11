import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

def audit_visual_elements(pdf_path):
    doc = fitz.open(pdf_path)
    print(f"\n================ VISUAL ELEMENT AUDIT FOR {pdf_path} (Total Pages: {len(doc)}) ================")
    
    # Page height in points is usually 792 for Letter or 842 for A4.
    # In this doc: 8.5 x 11 inches = 612 x 792 pt.
    # Footer "CS3711 – Summer Internship" is around y = 753.5 in top-down coordinates (or 38.5 from bottom).
    
    for p_num, page in enumerate(doc, 1):
        rect = page.rect
        page_h = rect.height
        
        # In PyMuPDF, coordinates are (x0, y0, x1, y1) from top-left (0,0) down to (width, height)
        # Footer is typically near y = 745 to 765.
        # Bottom border box is at y = 756 or 760.
        
        blocks = page.get_text("blocks")
        # filter out the footer block (usually contains "CS3711" or "Summer Internship" or page number near y1 > 735)
        content_bottoms = []
        last_block_text = ""
        
        for b in blocks:
            x0, y0, x1, y1, text, block_no, block_type = b
            clean_text = text.strip()
            # check if this is footer
            if "CS3711" in clean_text or ("Summer Internship" in clean_text and y0 > 720):
                continue
            if clean_text:
                content_bottoms.append((y1, "text: " + clean_text.replace('\n', ' ')[:40]))
                
        # Also check images
        for img_info in page.get_images():
            xref = img_info[0]
            for img_rect in page.get_image_rects(xref):
                # Ignore background or full border images if any
                if img_rect.height < page_h - 50:
                    content_bottoms.append((img_rect.y1, f"img: {img_rect.width:.1f}x{img_rect.height:.1f}"))
                    
        if content_bottoms:
            content_bottoms.sort(key=lambda x: x[0])
            max_y1 = content_bottoms[-1][0]
            desc = content_bottoms[-1][1]
            
            # The footer text baseline in Letter is around y = 748, so distance from content bottom to footer is:
            # 742 - max_y1
            dist_to_footer = 742.0 - max_y1
            print(f"Page {p_num:2d}: content_y1={max_y1:5.1f} | dist_to_footer={dist_to_footer:5.1f} pt ({dist_to_footer/72.0:4.2f} in) | last={desc}")
        else:
            print(f"Page {p_num:2d}: NO CONTENT FOUND!")

if __name__ == "__main__":
    audit_visual_elements("civic evidence.pdf")
