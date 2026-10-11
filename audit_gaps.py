import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")
print(f"Total pages: {len(reader.pages)}")

for p_num, page in enumerate(reader.pages, 1):
    lowest_y = [1000.0]
    lowest_text = [""]
    
    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            y = tm[5]
            if y > 50: # above footer
                if y < lowest_y[0]:
                    lowest_y[0] = y
                    lowest_text[0] = text.strip()
                    
    page.extract_text(visitor_text=visitor)
    
    gap_pt = lowest_y[0] - 38.5 if lowest_y[0] < 1000 else 700
    gap_inches = gap_pt / 72.0
    
    status = "OK (FULL)" if gap_pt < 65 else f"GAP! ({gap_pt:.1f} pt = {gap_inches:.2f} in)"
    
    print(f"Page {p_num:2d}: lowest_y={lowest_y[0]:5.1f} | gap={gap_pt:5.1f} pt ({gap_inches:.2f} in) -> {status} | '{lowest_text[0][:40]}'")
