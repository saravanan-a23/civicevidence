import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
reader = pypdf.PdfReader(ref_pdf)
for p in [5, 6, 7, 8, 9]:
    print(f"=== Page {p+1} ===")
    lines = [l.strip() for l in reader.pages[p].extract_text().split('\n') if l.strip()]
    print(' FIRST 2:', lines[:2])
    print(' LAST 2: ', lines[-2:])
