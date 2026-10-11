import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

def visitor_body(text, cm, tm, font_dict, font_size):
    if text.strip():
        # tm[4] is x, tm[5] is y
        print(f"  y={tm[5]:6.1f}, x={tm[4]:6.1f}, size={font_size:4.1f}: {repr(text.strip()[:40])}")

print("=== REF PDF 1 PAGE 1 TEXT POSITIONS ===")
ref_reader = pypdf.PdfReader(r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf")
ref_reader.pages[0].extract_text(visitor_text=visitor_body)

print("\n=== CIVIC EVIDENCE PDF PAGE 1 TEXT POSITIONS ===")
new_reader = pypdf.PdfReader("civic evidence.pdf")
new_reader.pages[0].extract_text(visitor_text=visitor_body)
