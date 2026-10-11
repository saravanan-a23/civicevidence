import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
reader = pypdf.PdfReader(ref_pdf)
print(f"Total pages in Reference PDF 1: {len(reader.pages)}")

for p_num, page in enumerate(reader.pages, 1):
    lowest_y = [1000.0]
    lowest_text = [""]
    
    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            y = tm[5]
            if y > 60: # above footer at 50 pt
                if y < lowest_y[0]:
                    lowest_y[0] = y
                    lowest_text[0] = text.strip()
                    
    page.extract_text(visitor_text=visitor)
    
    gap_pt = lowest_y[0] - 50.1 if lowest_y[0] < 1000 else 700
    gap_inches = gap_pt / 72.0
    
    print(f"Ref Page {p_num:2d}: lowest_y={lowest_y[0]:5.1f} | gap={gap_pt:5.1f} pt ({gap_inches:.2f} in) | '{lowest_text[0][:45]}'")
